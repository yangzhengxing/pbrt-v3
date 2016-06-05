#ifndef MSET_PARAMS_SKIN_SH
#define MSET_PARAMS_SKIN_SH

uniform vec3	uSubdermisColor;
uniform vec3	uFresnelColor;
uniform vec3	uTranslucencyColor;

USE_TEXTURE2D(tSubdermisMap);
USE_TEXTURE2D(tTranslucencyMap);
USE_TEXTURE2D(tFresnelMap);

uniform float	uNormalSmooth;
uniform float	uSubdermisScatter;
uniform float	uTranslucencyScatter;
uniform float	uFresnelScatter;
uniform float 	uFresnelOcc;
uniform float	uMaskWithGloss;
uniform float	uShadowBlur;

//dither
USE_TEXTURE2D(tNoise);

#define SAMPLE_COUNT 8
#define INV_SAMPLE_COUNT (0.125)
#define INV_SAMPLE_COUNT_PLUS_ONE (1.0/9.0)
uniform vec4	uKernel[SAMPLE_COUNT];
uniform vec4	uNoiseScaleBias;
uniform float	uMeshScale;

struct SkinParams 
{
	vec3 normal;
	vec3 smoothNormal;

	vec3 subdermisColor;
	float subdermisScatter;
	
	vec3 translucencyColor;
	float translucencyScatter;

	vec3 fresnelColor;
	float fresnelScatter;
	float fresnelOcc;

	float skinMix;
	float shadowBlur;

	float blurScale;
};

void 	sampleSkinParams( inout SkinParams skin, FragmentState s ) {
	vec4 subdermisMap =		texture2D( tSubdermisMap, s.vertexTexCoord );
	vec4 translucencyMap =	texture2D( tTranslucencyMap, s.vertexTexCoord );
	vec4 fresnelMap =		texture2D( tFresnelMap, s.vertexTexCoord );	

	#ifdef tNormalMap_present		
		skin.normal = 		s.normal;
		skin.smoothNormal = tangentToObject(s, smoothSampleNormalMap(s.vertexTexCoord, uNormalSmooth));
		skin.smoothNormal = lerp(s.normal, skin.smoothNormal, uNormalSmooth * subdermisMap.a);
	#else
		skin.smoothNormal = s.normal;
		skin.normal = 		s.normal;
	#endif
	
	skin.subdermisColor =		uSubdermisColor * subdermisMap.rgb;
	skin.subdermisScatter =		uSubdermisScatter;

	skin.translucencyColor =	uTranslucencyColor * translucencyMap.rgb;
	skin.translucencyScatter =	uTranslucencyScatter;	

	skin.fresnelColor = 		uFresnelColor * fresnelMap.rgb;
	skin.fresnelScatter =		uFresnelScatter;
	skin.fresnelOcc =			uFresnelOcc;

	//NOTE: skinMask from grayscale was briefly attempted in 206.
	//for various content reasons, subdermisMap.a is the only
	//true way to mask skin to lambert.
	
	skin.skinMix = subdermisMap.a;
	skin.shadowBlur = uShadowBlur * subdermisMap.a;
	skin.blurScale = uMeshScale;
}

#endif
