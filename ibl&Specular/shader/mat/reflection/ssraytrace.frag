#ifndef MSET_SCREEN_SPACE_RAY_TRACE_H
#define	MSET_SCREEN_SPACE_RAY_TRACE_H

#include "../../common/util.sh"

USE_TEXTURE2D(tScreenDepth);
USE_TEXTURE2D(tScreenDepthLow);

uniform mat4 uRaytraceProjectionMatrix;
uniform vec4 uScreenColorSize; // { w, h, 1/w, 1/h }

vec2	posToNDC( vec3 p )
{
	vec4 pp = mulPoint( uRaytraceProjectionMatrix, p );
	return pp.xy / pp.w;
}

vec2	NDCToTexCoord( vec2 ndc )
{
	#ifdef RENDERTARGET_Y_DOWN
		return vec2(0.5,-0.5)*ndc + vec2(0.5,0.5);
	#else
		return vec2(0.5, 0.5)*ndc + vec2(0.5,0.5);
	#endif
}

bool	rangeIntersect( float anear, float afar, float bnear, float bfar )
{
	return afar <= bnear && anear >= bfar;
}

void	traceRay( vec3 pos, vec3 dir,
				  out vec2 coords, out float mask )
{
	#ifndef SSR_COURSE_STEPS
		#define SSR_COURSE_STEPS		24
	#endif
	#ifndef SSR_SEARCH_STEPS
		#define	SSR_SEARCH_STEPS		10
	#endif
	#ifndef SSR_REFINE_STEPS
		#define SSR_REFINE_STEPS		6
	#endif

	//determine our ray marching settings
	float maxRayDist = abs(pos.z)*rsqrt(0.01 + saturate(dot(dir.xy,dir.xy)));
	float incr = maxRayDist/float(SSR_COURSE_STEPS);
	float zslope = dir.z*incr;

	bool hit = false;
	float edge;
	vec2 tc;
	HINT_LOOP
	for( float t=0.0; t<maxRayDist; t+=incr )
	{
		//view space ray march location
		vec3 p = pos + t*dir;

		//project it into screen space
		vec2 ndc = posToNDC( p );
		
		//convert to texture coordinates
		tc = NDCToTexCoord( ndc );

		//sample a range of depths with the low res depth map
		//this sample is filtered & padded a bit, which actually helps
		//with corner artifacts but is a bit of a hack
		vec2 dminmax = texture2DLod( tScreenDepthLow, tc, 0.0 ).xy;

		//does our sample position come near the range of depths?
		float pz_prev = p.z - float(SSR_SEARCH_STEPS)*zslope;
		float pz_next = p.z + float(SSR_SEARCH_STEPS)*zslope;
		HINT_BRANCH
		if( rangeIntersect( max(pz_prev,pz_next), min(pz_prev,pz_next), dminmax.y, dminmax.x ) )
		{
			//search along this subsection of the ray,
			//find closest point under surface and within 'threshold'
			float threshold = 0.5*incr;
			float bestDiff = threshold;
			vec3 bestp = p;
			
			HINT_UNROLL
			for( int i=1; i<=SSR_SEARCH_STEPS; ++i )
			{
				float dt = (float(i)/float(SSR_SEARCH_STEPS));
				vec3 p2 = p + dt*(dir*incr);
				vec2 tc2 = NDCToTexCoord( posToNDC( p2 ) );
				float d = texture2DLod( tScreenDepth, tc2, 0.0 ).x;
				HINT_FLATTEN
				if( d >= p2.z ) //under surface
				{
					float diff = d - p2.z;
					HINT_FLATTEN
					if( diff < bestDiff ) //best candidate yet
					{
						bestDiff = diff;
						bestp = p2;
					}
				}
			}
			
			HINT_BRANCH
			if( bestDiff < threshold )
			{
				//we have a crude hit, lets do some closer samples with a tighter threshold
				threshold = 0.25*incr;
				p = bestp;
				HINT_UNROLL
				for( int i=-SSR_REFINE_STEPS/2; i<SSR_REFINE_STEPS/2; ++i )
				{
					float dt = incr*(float(i)/float(SSR_REFINE_STEPS/2));
					vec3 p2 = p + dt*(dir*incr);
					vec2 tc2 = NDCToTexCoord( posToNDC( p2 ) );
					float d = texture2DLod( tScreenDepth, tc2, 0.0 ).x;
					HINT_FLATTEN
					if( d >= p2.z ) //under surface
					{
						float diff = d - p2.z;
						HINT_FLATTEN
						if( diff < bestDiff ) //best candidate yet
						{
							bestDiff = diff;
							bestp = p2;
						}
					}
				}
				
				if( hit = (bestDiff < threshold) )
				{
					ndc = posToNDC(bestp);
					tc = NDCToTexCoord(ndc);
				}
			}
		}

		//if our ray has left the screen bounds, or we have a hit, then we're done
		edge = max( abs(ndc.x), abs(ndc.y) );
		HINT_FLATTEN
		if( edge > 1.0 || hit )
		{ break; }
	}

	//snap texcoords to nearest texel
	tc = (floor(tc * uScreenColorSize.xy) + vec2(0.5,0.5)) * uScreenColorSize.zw;
	
	//output final values
	coords = hit ? tc : vec2(0.0,0.0);
	mask = hit ? saturate( 8.0 - 8.0*edge ) : 0.0;
}

#endif