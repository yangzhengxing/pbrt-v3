#include "data/shader/mat/state.frag"
#include "data/shader/mat/other/directLightParams.sh"
#include "fresnel.frag"

#ifndef SPECULAR_SECONDARY
	#define	GGXFuncName			ReflectionGGX
	#define	Reflection			ReflectionGGX
#else
	uniform float				uGGXSecondaryGloss;
	uniform vec3				uGGXSecondaryIntensity;
	uniform vec3				uGGXSecondaryFresnel;
	#define	GGXFuncName			ReflectionSecondaryGGX
	#define	ReflectionSecondary	ReflectionSecondaryGGX
#endif

void	GGXFuncName( inout FragmentState s )
{
	//roughness
	float roughness = 1.0 - s.gloss;
	#ifdef SPECULAR_SECONDARY
		roughness = saturate(roughness - roughness*uGGXSecondaryGloss);
	#endif
	float a = max( roughness * roughness, 2e-3 );
	float a2 = a * a;

	//light params
	LightParams l = getLight( s.vertexPosition );
	adjustAreaLightSpecular( l, reflect( -s.vertexEye, s.normal ), rcp(3.141592 * a2) );

	//various dot products
	vec3 H = normalize(l.direction + s.vertexEye);
	float NdotH = saturate(dot(s.normal,H));
	float VdotN = saturate(dot(s.vertexEye,s.normal));
	float LdotN = saturate(dot(l.direction,s.normal));
	float VdotH = saturate(dot(s.vertexEye,H));
	
	//horizon
	float atten = l.attenuation;
    float horizon = 1.0 - LdotN;
    horizon *= horizon; horizon *= horizon;
    atten = atten - atten * horizon;
	
	//incident light
	vec3 spec = l.color * s.shadow * (atten * LdotN);
	
	//microfacet distribution
	float d = ( NdotH * a2 - NdotH ) * NdotH + 1.0;
		  d *= d;
	float D = a2 / (3.141593 * d);

	//geometric / visibility
	float k = a * 0.5;
	float G_SmithL = LdotN * (1.0 - k) + k;
	float G_SmithV = VdotN * (1.0 - k) + k;
	float G = 0.25 / ( G_SmithL * G_SmithV );
	
	//fresnel
	vec3 reflectivity = s.reflectivity, fresn = s.fresnel;
	#ifdef SPECULAR_SECONDARY
		reflectivity *= uGGXSecondaryIntensity;
		fresn = uGGXSecondaryFresnel;
	#endif
	vec3 F = reflectivity + (fresn - fresn*reflectivity) * exp2( (-5.55473 * VdotH - 6.98316) * VdotH );
	
    //final
	s.specularLight += (D * G) * (F * spec);
}

#undef	GGXFuncName