#include "../../common/util.sh"

USE_TEXTURE2D(tDepth);
USE_TEXTURE2D(tNormal);

uniform vec4	uUnproject;	// { -1/proj[0][0], -1/proj[1][1], -proj[2][0]/proj[0][0], -proj[2][1]/proj[1][1] }
uniform vec4	uLightPosition;
uniform mat4	uProjectionMatrix;
uniform mat4	uShadowMatrix;

vec2	posToNDC( vec3 p )
{
	vec4 pp = mulPoint( uProjectionMatrix, p );
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

BEGIN_PARAMS
	INPUT0(vec4,fScreenCoord)

	OUTPUT_COLOR0(vec3)
END_PARAMS
{
	OUT_COLOR0.xyz = vec3(0.0,0.0,0.0);

	//screen texcoord from projection position
	vec2 ndcCoord = fScreenCoord.xy / fScreenCoord.w;
	vec2 texCoord = NDCToTexCoord( ndcCoord );

	//reconstruct view space position from depth value
	vec3 pos;
	pos.z = texture2DLod( tDepth, texCoord, 0.0 ).x;
	pos.xy = pos.z * ( ndcCoord.xy * uUnproject.xy + uUnproject.zw );

	//clip based on shadow projection
	{
		vec4 shadowPos = mulPoint( uShadowMatrix, pos );
		if( any(greaterThan(abs(shadowPos.xyz),shadowPos.www)) )
		{ discard; }
	}

	//determine light vector
	vec3 posToLight = uLightPosition.xyz - uLightPosition.w*pos;
	vec3 searchDir = normalize( posToLight );
	
	//check normal; back facing geometry shouldn't be traced
	vec3 normal;
	normal.xy = texture2DLod( tNormal, texCoord, 0.0 ).xy;
	normal.z = sqrt( 1.0 - dot(normal.xy,normal.xy) );
	HINT_BRANCH
	if( dot(normal,posToLight) > 0.0 )
	{
		//search along ray
		#define	SEARCH_STEPS 16

		float searchDist = abs(pos.z) * 0.03; //try: searchDist could be chosen from shadow map derivative instead
		float maxThreshold = searchDist * (1.0/4.0);
		pos += normal * ( 0.001 * abs(pos.z) ); //pad away from surface a bit

		vec3 d = searchDir * searchDist;
		float bestDist = 1e12;
		HINT_UNROLL
		for( int i=1; i<=SEARCH_STEPS; ++i )
		{
			float t = (float(i)/float(SEARCH_STEPS));
			vec3 p = pos + t*d;
			vec2 ndc = posToNDC( p );
			float depth = texture2DLod( tDepth, NDCToTexCoord(ndc), 0.0 ).x;
			float dist = depth - p.z;
			bestDist = (max(abs(ndc.x),abs(ndc.y)) <= 1.0 &&
						dist > 0.0 &&
						dist < bestDist) ? dist : bestDist;
		}

		float shadow = (bestDist < maxThreshold) ? 0.0 : 1.0;
		OUT_COLOR0.xyz = vec3( shadow, shadow, shadow );
	}
}