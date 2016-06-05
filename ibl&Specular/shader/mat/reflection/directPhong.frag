#include "data/shader/mat/state.frag"
#include "data/shader/mat/other/directLightParams.sh"
#include "fresnel.frag"

#ifndef SPECULAR_SECONDARY
	#define	BlinnPhongFuncName	ReflectionBlinnPhong
	#define	Reflection			ReflectionBlinnPhong
#else
	uniform float				uPhongSecondaryGloss;
	uniform vec3				uPhongSecondaryIntensity;
	uniform vec3				uPhongSecondaryFresnel;
	#define	BlinnPhongFuncName	ReflectionSecondaryBlinnPhong
	#define	ReflectionSecondary	ReflectionSecondaryBlinnPhong
#endif

void	BlinnPhongFuncName( inout FragmentState s )
{
	//determine specular exponent from gloss map & settings
	float gloss = min( s.gloss, 0.995 );
	#ifdef SPECULAR_SECONDARY
		gloss = saturate( gloss * uPhongSecondaryGloss );
	#endif
	float specExp = -10.0 / log2( gloss*0.968 + 0.03 );
	specExp *= specExp;

	//light params
	LightParams l = getLight( s.vertexPosition );
	float phongNormalize = (specExp + 4.0)/(8.0*3.141592);
	adjustAreaLightSpecular( l, reflect( -s.vertexEye, s.normal ), phongNormalize );
	
	//blinn-phong term
	vec3 H = normalize( s.vertexEye + l.direction );
	float phong = phongNormalize * pow( saturate( dot(H, s.normal) ), specExp );
	
	//horizon occlusion
	float horizon = 1.0 - saturate( dot( l.direction, s.normal ) );
	horizon *= horizon; horizon *= horizon;
	phong = phong - phong*horizon;

	//spec color
	vec3 spec =	(s.shadow * l.attenuation) *
				saturate( dot( l.direction, s.normal ) ) *
				l.color;

	//fresnel
	float glossAdjust = gloss*gloss;
	vec3 reflectivity = s.reflectivity, fresn = s.fresnel;
	#ifdef SPECULAR_SECONDARY
		reflectivity *= uPhongSecondaryIntensity;
		fresn = uPhongSecondaryFresnel;
	#endif
	spec *= fresnel(	dot( s.vertexEye, s.normal ),
						reflectivity,
						fresn * glossAdjust	);

	//add it on
	s.specularLight += spec * phong;
}
#undef BlinnPhongFuncName