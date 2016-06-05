#include "data/shader/mat/state.frag"
#include "data/shader/mat/other/directLightParams.sh"
#include "fresnel.frag"
#include "paramsAnisotropic.sh"

#ifndef SPECULAR_SECONDARY
	#define	AnisotropicFuncName	ReflectionAnisotropic
	#define	Reflection			ReflectionAnisotropic
#else
	#define	AnisotropicFuncName	ReflectionSecondaryAnisotropic
	#define	ReflectionSecondary	ReflectionSecondaryAnisotropic
#endif

void	AnisotropicFuncName( inout FragmentState s )
{
	#ifdef SPECULAR_SECONDARY
		float gloss = saturate( s.gloss * uAnisoSecondaryGloss );
	#else 
		float gloss = s.gloss;
	#endif

	LightParams l = getLight( s.vertexPosition );
	adjustAreaLightSpecular( l, reflect( -s.vertexEye, s.normal ), 1.0-gloss );

	//gloss
	//determine specular exponent from gloss map & settings
	float specExp = -10.0 / log2( gloss*0.968 + 0.03 );
	specExp *= specExp;
	float anisoExp = mix( specExp, 16.0, uAnisoSpread );

	//blinn-phong
	vec3 h = normalize( s.vertexEye + l.direction );
	
	//anisotropic projection
	//h is projected onto the B-plane (shared by strand dir and N) to max out the dot-product along the B axis.
	vec3 N = s.normal;	
	vec3 T, B; SampleAnisoTangent( s, T, B );
	
	#ifdef SPECULAR_SECONDARY
		N = normalize(N + T * uAnisoSecondaryShift * 0.5);
	#endif
	
	h = normalize(h - B*dot(h,B) * sqrt(uAnisoSpread));

	float HdotN = saturate( dot( h, N ) );
	float illum = pow( HdotN, specExp );
	illum *= (specExp + 4.0)/(8.0*3.141592);
	illum *= 1.0 - uAnisoSpread * 0.5;
	
	//horizon
	float horizon = 1.0 - saturate( dot( l.direction, N ) );
	horizon *= horizon; horizon *= horizon;
	illum = illum - illum*horizon;

	//spec color
	vec3 spec = (l.attenuation * illum) * l.color;

	//fresnel
	float glossAdjust = gloss*gloss;
	vec3 reflectivity = s.reflectivity, fresn = s.fresnel;
	#ifdef SPECULAR_SECONDARY
		reflectivity *= uAnisoSecondaryColor;
		fresn = uAnisoSecondaryFresnel;
	#endif
	spec *= fresnel(	dot( s.vertexEye, s.normal ),
						reflectivity,
						fresn * glossAdjust	);

	#ifdef SPECULAR_SECONDARY
		spec *= uAnisoSecondaryColor;
	#endif

	//add it on
	s.specularLight += spec * s.shadow;
}
#undef AnisotropicFuncName