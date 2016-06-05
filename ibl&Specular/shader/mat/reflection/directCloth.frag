#include "data/shader/mat/state.frag"
#include "data/shader/mat/other/directLightParams.sh"
#include "fresnel.frag"	
	
#ifndef SPECULAR_SECONDARY
	#define	ClothFuncName	    ReflectionCloth
	#define	Reflection			ReflectionCloth	
#else
	uniform float				uClothSecondaryGloss;
	uniform vec3				uClothSecondaryIntensity;
	uniform vec3				uClothSecondaryFresnel;
	
	#define	ClothFuncName	    ReflectionSecondaryCloth
	#define	ReflectionSecondary	ReflectionSecondaryCloth
#endif
	
void	ClothFuncName( inout FragmentState s )
{
	//roughness
	float roughness =  max(0.00000001, 1.0f - s.gloss); //having to limit roughness/glossines. when surface is fully glossy/infinitely glossy, there is a capping error.
	#ifdef SPECULAR_SECONDARY
		roughness =  max(0.00000001, saturate(roughness * uGGXSecondaryGloss));
	#endif
	float a2 = roughness * roughness;
	a2 *= a2;

	//light params
	LightParams l = getLight( s.vertexPosition );
	adjustAreaLightSpecular( l, reflect( -s.vertexEye, s.normal ), roughness );
	
	//needed vectors
	vec3 V = s.vertexEye;
	vec3 N = s.normal;
	float3 R = reflect( -V, N );
	const float PI = 3.14159265;

	vec3 reflectivity = s.reflectivity;
		#ifdef SPECULAR_SECONDARY
		reflectivity *= uClothSecondaryIntensity;
	#endif
	
	//bunch of dot products
	vec3 H = normalize(l.direction + V);
	float NdotH = saturate(dot(N,H));
	float VdotN = saturate(dot(V,N));
	float LdotN = saturate(dot(l.direction,N));
	float VdotH = saturate(dot(V,H));
    float NdotH2 = NdotH * NdotH;
    float oo_pi = 1.0f / PI;
	
	vec3 spec = l.attenuation * l.color * s.shadow * LdotN;

	//horizon
	float horizon = 1.0 - LdotN;
	horizon *= horizon; horizon *= horizon;
	spec = spec - spec * horizon;
	
	//cloth brdf sourced from: http://blog.selfshadow.com/publications/s2013-shading-course/rad/s2013_pbs_rad_notes.pdf
	//and http://www.cs.utah.edu/~michael/brdfs/facets.pdf
	
	//First define the specular distribution
    float cot2 = NdotH2 / (1.000001 - NdotH2);
    float sin2 = 1.0 - NdotH2;
    float sin4 = sin2 * sin2;
    float amp = 4.0;
    float cnorm = 1.0 / (PI * (1 + amp * a2));
    cnorm *= (1.0f + (amp * exp(-cot2 / a2) / sin4));

    float microfacet = 1.0 / (4.0 * (LdotN + VdotN - LdotN * VdotN));
    microfacet *= cnorm;

	//then the fresnel model
	vec3 SchlickFresnel = reflectivity + (1.0 - reflectivity) * pow(1.0 - VdotH, 5.0);
	SchlickFresnel = lerp(reflectivity, SchlickFresnel, s.fresnel); //This line included for backward compatibility with the old specular model.
	
	//put them all together, Geometric visibility term is not needed/desired in cloth brdf.	
	s.specularLight += (cnorm * SchlickFresnel) * spec * s.shadow;
	
}	
#undef	ClothFuncName