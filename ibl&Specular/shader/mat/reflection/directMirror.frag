#include "data/shader/mat/state.frag"
#include "data/shader/mat/other/directLightParams.sh"
#include "fresnel.frag"

#ifndef SPECULAR_SECONDARY
	#define	MirrorFuncName		ReflectionMirror
	#define	Reflection			ReflectionMirror
#else
	uniform vec3	uMirrorSecondaryIntensity;
	uniform vec3	uMirrorSecondaryFresnel;
	#define	MirrorFuncName		ReflectionSecondaryMirror
	#define	ReflectionSecondary	ReflectionSecondaryMirror
#endif

void	MirrorFuncName( inout FragmentState s )
{
	//boolean ray trace against light shape
	LightParams l = getLight( s.vertexPosition );
	vec3 r = reflect( -s.vertexEye, s.normal );
	bool hit = adjustAreaLightSpecular( l, r, 1.0 );
	hit = hit && dot(r,l.direction) > 0.0;
	vec3 spec = (hit ? l.attenuation : 0.0) * l.color;

	//fresnel
	vec3 reflectivity = s.reflectivity, fresn = s.fresnel;
	#ifdef SPECULAR_SECONDARY
		reflectivity *= uMirrorSecondaryIntensity;
		fresn = uMirrorSecondaryFresnel;
	#endif
	spec *= fresnel( dot( s.vertexEye, s.normal ),
					 reflectivity,
					 fresn );

	//add it on
	s.specularLight += spec * s.shadow;
}

#undef	MirrorFuncName