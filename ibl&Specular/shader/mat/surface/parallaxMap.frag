//inherits "normalMap.frag"

USE_TEXTURE2D(tParallaxHeightMap);

uniform vec4	uParallaxSwizzle;
uniform vec2	uParallaxDepthOffset;
uniform float	uParallaxFlipY;

float	ParallaxSample( vec2 c )
{
	return 1.0 - dot( texture2DLod( tParallaxHeightMap, c, 0.0 ), uParallaxSwizzle );
}

void	SurfaceParallaxMap( inout FragmentState s )
{
	vec3 dir =	vec3(	dot( -s.vertexEye, s.vertexTangent ),
						dot( -s.vertexEye, s.vertexBitangent ) * uParallaxFlipY,
						dot( -s.vertexEye, s.vertexNormal )	);
	vec2 maxOffset = dir.xy * (uParallaxDepthOffset.x / (abs(dir.z) + 0.001));
	
	float minSamples = 16.0;
	float maxSamples = 128.0;
	float samples = saturate( 3.0*length(maxOffset) );
	float incr = rcp( mix( minSamples, maxSamples, samples ) );

	vec2 tc0 = s.vertexTexCoord - uParallaxDepthOffset.y*maxOffset;
	float h0 = ParallaxSample( tc0 );
	HINT_LOOP
	for( float i=incr; i<=1.0; i+=incr )
	{
		vec2 tc = tc0 + maxOffset * i;
		float h1 = ParallaxSample( tc );
		if( i >= h1 )
		{
			//hit! now interpolate
			float r1 = i, r0 = i-incr;
			float t = (h0-r0)/((h0-r0)+(-h1+r1));
			float r = (r0-t*r0) + t*r1;
			s.vertexTexCoord = tc0 + r*maxOffset;
			break;
		}
		h0 = h1;
	}

	//standard normal mapping
    SurfaceNormalMap(s);
}

#undef  Surface
#define	Surface	SurfaceParallaxMap