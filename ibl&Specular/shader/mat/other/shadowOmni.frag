#include "../../common/util.sh"

USE_TEXTURE2D(tDepth);
USE_TEXTURECUBE(tShadowMap);
USE_TEXTURE2D(tRotationNoise);
USE_TEXTURE2D(tGel);

uniform mat4	uShadowMatrix;
uniform vec4	uUnproject;	// { -1/proj[0][0], -1/proj[1][1], -proj[2][0]/proj[0][0], -proj[2][1]/proj[1][1] }
uniform vec3	uLightSize;
uniform vec4	uRotationNoiseScaleBias;
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

	//determine object position in shadow space
	pos = mulPoint( uShadowMatrix, pos ).xyz;
	float depth = length(pos);

	float shadow = 1.0;
	#ifdef SHADOWS
	#ifdef AREA_SHADOWS
		//noise rotation & sample basis
		vec4 rotation = texture2D( tRotationNoise, uRotationNoiseScaleBias.xy*screenCoord + uRotationNoiseScaleBias.zw );
		rotation = 2.0*rotation - vec4(1.0,1.0,1.0,1.0);
		vec3 objX = normalize( cross( vec3(0.0,1.0,0.0), -pos ) );
		vec3 objY = normalize( cross( -pos, objX ) );

		//find our search space size
		vec3 ox = objX * uLightSize.z, oy = objY * uLightSize.z;
		ox.x += uLightSize.x; oy.y += uLightSize.y;

		//search for occluders
		float avgOccluder = 0.0;
		float occluderCount = 0.0;
		#define	SEARCH_GRID	5
		HINT_UNROLL for( int i=0; i<SEARCH_GRID; ++i )
		HINT_UNROLL for( int j=0; j<SEARCH_GRID; ++j )
		{
			vec2 offset =	(float(i)/float(SEARCH_GRID-1) - 0.5)*rotation.xy +
							(float(j)/float(SEARCH_GRID-1) - 0.5)*rotation.zw;
			vec3 p = (pos + offset.x*ox) + offset.y*oy;
			float d = textureCubeLod( tShadowMap, p, 0.0 ).x;
			HINT_FLATTEN
			if( d < depth )
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
			vec3 pw = ((depth - avgOccluder) * uLightSize) / avgOccluder;
			ox = objX * pw.z; oy = objY * pw.z;
			ox.x += pw.x; oy.y += pw.y;

			//sample shadow
			shadow = 0.0;
			#define	SAMPLE_GRID	5
			HINT_UNROLL for( int i=0; i<SAMPLE_GRID; ++i )
			HINT_UNROLL for( int j=0; j<SAMPLE_GRID; ++j )
			{
				vec2 offset =	(float(i)/float(SEARCH_GRID-1) - 0.5)*rotation.xy +
								(float(j)/float(SEARCH_GRID-1) - 0.5)*rotation.zw;
				vec3 p = (pos + offset.x*ox) + offset.y*oy;
				shadow += float( textureCubeLod( tShadowMap, p, 0.0 ).x > depth );
			}
			shadow *= 1.0/float(SAMPLE_GRID*SAMPLE_GRID);
		}
	#else
		#ifdef TEXTURE_GATHER
			vec4 d = textureGather( tShadowMap, pos );
			d = vec4( greaterThan( d, vec4(depth,depth,depth,depth) ) );
			shadow = dot( d, vec4(0.25,0.25,0.25,0.25) );
		#else
			shadow = float( textureCubeLod( tShadowMap, pos, 0.0 ).x > depth );
		#endif
	#endif
	#endif
	
	//gel
	vec3 gel = texture2D( tGel, (pos/depth).xy * uGelTile.xy + uGelTile.zw ).xyz;

	//done
	OUT_COLOR0.xyz = shadow * gel;
}