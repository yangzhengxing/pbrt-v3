#include "data/shader/mat/state.frag"

USE_TEXTURE2D(tSpecularMap);

uniform vec3	uSpecularColor;
uniform vec3	uSpecularFresnel;
uniform float	uSpecularConserve;

void	ReflectivitySpecularMap( inout FragmentState s )
{
	s.reflectivity = uSpecularColor * texture2D( tSpecularMap, s.vertexTexCoord ).xyz;
	s.albedo.xyz = s.albedo.xyz - s.albedo.xyz * uSpecularConserve * s.reflectivity;
	s.fresnel = uSpecularFresnel;
}

#define	Reflectivity	ReflectivitySpecularMap