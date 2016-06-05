#include "data/shader/mat/state.frag"
#include "fresnel.frag"

#ifndef tMirrorCubeMap_Present
	#define	tMirrorCubeMap_Present
	USE_TEXTURECUBE(tMirrorCubeMap);
#endif

#ifndef tLocalReflectionMap_Present
	#define	tLocalReflectionMap_Present
	USE_TEXTURE2D(tLocalReflectionMap);
#endif

#ifndef SPECULAR_SECONDARY
	uniform float	uMirrorHorizonFade;
	uniform float	uMirrorBrightness;

	#define	MirrorFuncName		ReflectionMirror
	#define	Reflection			ReflectionMirror
#else
	uniform vec3	uMirrorSecondaryIntensity;
	uniform vec3	uMirrorSecondaryFresnel;
	uniform float	uMirrorSecondaryHorizonFade;
	uniform float	uMirrorSecondaryBrightness;
	#define uMirrorHorizonFade	uMirrorSecondaryHorizonFade
	#define	uMirrorBrightness	uMirrorSecondaryBrightness
	
	#define	MirrorFuncName		ReflectionSecondaryMirror
	#define	ReflectionSecondary	ReflectionSecondaryMirror
#endif

void	MirrorFuncName( inout FragmentState s )
{
	//sample reflection map
	vec3 r = reflect( -s.vertexEye, s.normal );
	vec3 spec = uMirrorBrightness * textureCube( tMirrorCubeMap, r ).xyz;

	//fresnel
	vec3 reflectivity = s.reflectivity, fresn = s.fresnel;
	#ifdef SPECULAR_SECONDARY
		reflectivity *= uMirrorSecondaryIntensity;
		fresn = uMirrorSecondaryFresnel;
	#endif
	spec *= fresnel( dot( s.vertexEye, s.normal ),
					 reflectivity,
					 fresn );
	
	//mask for local reflections
	spec *= texture2D( tLocalReflectionMap, s.screenTexCoord ).x;

	//horizon test
	float horiz = dot( r, s.vertexNormal );
	horiz = saturate( 1.0 + uMirrorHorizonFade*horiz );
	horiz *= horiz;
	spec *= horiz;

	//add it on
	s.specularLight += spec;
}

#undef	MirrorFuncName