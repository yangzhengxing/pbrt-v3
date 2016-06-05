#include "../../common/util.sh"

USE_TEXTURE2D(tDepth);
USE_TEXTURE2D(tShadowMap);
USE_TEXTURE2D(tRotationNoise);
USE_TEXTURE2D(tGel);

uniform mat4	uShadowMatrix;
uniform mat4	uShadowTextureMatrix;
uniform vec4	uUnproject;	// { -1/proj[0][0], -1/proj[1][1], -proj[2][0]/proj[0][0], -proj[2][1]/proj[1][1] }
uniform vec3	uLightX, uLightY, uLightSize;
uniform vec4	uRotationNoiseScaleBias;
uniform vec3	uVignette;	// { 2*vignette, vignette, sharpness }
uniform vec4	uGelTile;
uniform vec2	uShadowMapSize; // { w, h }

BEGIN_PARAMS
	INPUT0(vec4,fScreenCoord)

	OUTPUT_COLOR0(vec3)
END_PARAMS
{
	//screen texcoord from projection position
	vec2 ndcCoord = fScreenCoord.xy / fScreenCoord.w;
	#ifdef RENDERTARGET_Y_DOWN
		vec2 screenCoord = vec2(0.5,-0.5)*ndcCoord + vec2(0.5,0.5);
	#else
		vec2 screenCoord = vec2(0.5,0.5)*ndcCoord + vec2(0.5,0.5);
	#endif

	//reconstruct 3D position (in camera view space) from depth value
	vec3 pos;
	pos.z = texture2DLod( tDepth, screenCoord, 0.0 ).x;
	pos.xy = pos.z * ( ndcCoord.xy * uUnproject.xy + uUnproject.zw );

	//compute shadow map space position
	vec4 texPos = mulPoint( uShadowTextureMatrix, pos );
	texPos.xyz /= texPos.w;

	//discard fragments outside the projection
	HINT_FLATTEN
	if( any(greaterThan( texPos.xyz, vec3(1.0,1.0,1.0))) ||
		any(lessThan( texPos.xyz, vec3(0.0,0.0,0.0) )) )
	{ discard; }

	//determine object position in shadow space
	vec3 objPos = mulPoint( uShadowMatrix, pos ).xyz;
	float objDepth = length(objPos);

	float shadow = 1.0;

	#ifdef SHADOWS
	#ifdef AREA_SHADOWS
		//rotation noise
		vec4 rotation = texture2D( tRotationNoise, uRotationNoiseScaleBias.xy*screenCoord + uRotationNoiseScaleBias.zw );
		rotation = 2.0*rotation - vec4(1.0,1.0,1.0,1.0);

		//light shape projection
		vec2 lightSize = uLightSize.xy + uLightSize.zz;

		//find our search space size
		vec2 searchSpaceSize = lightSize / objDepth;
		float avgOccluder = 0.0;
		float occluderCount = 0.0;
		#define	SEARCH_GRID	5
		HINT_UNROLL for( int i=0; i<SEARCH_GRID; ++i )
		HINT_UNROLL for( int j=0; j<SEARCH_GRID; ++j )
		{
			vec2 offset =	(float(i)/float(SEARCH_GRID-1) - 0.5)*rotation.xy +
							(float(j)/float(SEARCH_GRID-1) - 0.5)*rotation.zw;
			float d = texture2DLod( tShadowMap, texPos.xy + offset*searchSpaceSize, 0.0 ).x;
			HINT_FLATTEN
			if( d < objDepth )
			{
				avgOccluder += d;
				occluderCount += 1.0;
			}
		}
		
		HINT_BRANCH
		if( occluderCount > 0.0 )
		{
			//we have some occluders, let's proceed
			avgOccluder /= occluderCount;
			
			//estimate penumbra width
			vec2 pw = ((objDepth - avgOccluder) * lightSize) / avgOccluder;
			vec2 pwt = pw / objDepth;

			shadow = 0.0;
			#define	SAMPLE_GRID	5
			HINT_UNROLL for( int i=0; i<SAMPLE_GRID; ++i )
			HINT_UNROLL for( int j=0; j<SAMPLE_GRID; ++j )
			{
				vec2 offset =	(float(i)/float(SAMPLE_GRID-1) - 0.5)*rotation.xy +
								(float(j)/float(SAMPLE_GRID-1) - 0.5)*rotation.zw;
				shadow += float( texture2DLod( tShadowMap, texPos.xy + offset*pwt, 0.0 ).x > objDepth );
			}
			shadow *= 1.0/float(SAMPLE_GRID*SAMPLE_GRID);
		}
	#else
		#ifdef TEXTURE_GATHER
			vec4 d = textureGather( tShadowMap, texPos.xy );
			d = vec4( greaterThan( d, vec4(objDepth,objDepth,objDepth,objDepth) ) );
			float eps = 0.002;
			vec2 f = fract( texPos.xy*uShadowMapSize - vec2(0.5,0.5) + vec2(eps,eps) ) - vec2(eps,eps);
			shadow = mix( mix( d.w, d.z, f.x ), mix( d.x, d.y, f.x ), f.y );
			shadow *= shadow;
		#else
			float d = texture2DLod( tShadowMap, texPos.xy, 0.0 ).x;
			shadow = float( d > objDepth );
		#endif
	#endif
	#endif

	//spotlight vignette
	vec2 vignette = uVignette.x*texPos.xy - uVignette.yy;
	shadow *= saturate( uVignette.z - uVignette.z*dot( vignette, vignette ) );

	//gel
	vec3 gel = texture2D( tGel, texPos.xy * uGelTile.xy + uGelTile.zw ).xyz;

	//done
	OUT_COLOR0.xyz = shadow * gel;
}