#include "data/shader/mat/state.frag"

USE_TEXTURE2D(tReflectivityRefractiveIndex);

uniform vec3	uReflectivitySurfaceIndex;
uniform vec3	uReflectivitySurfaceExtinction;
uniform float	uReflectivityMediumIndex;

void	ReflectivityRefractiveIndex( inout FragmentState s )
{
	//IOR of the scene medium
	vec3 n1 = vec3( uReflectivityMediumIndex, uReflectivityMediumIndex, uReflectivityMediumIndex );

	//IOR of the surface
	vec3 mask = texture2D( tReflectivityRefractiveIndex, s.vertexTexCoord ).xyz;
	vec3 n2 = mix( vec3(1.0,1.0,1.0), uReflectivitySurfaceIndex, mask );
	vec3 k2 = mix( vec3(0.0,0.0,0.0), uReflectivitySurfaceExtinction, mask );

	//shout out to AJ Fresnel
	s.reflectivity = ((n1-n2)*(n1-n2) + k2*k2) / ((n1+n2)*(n1+n2) + k2*k2);
	s.fresnel = vec3(1.0,1.0,1.0);

	//energy conservation plz
	s.albedo.xyz -= s.albedo.xyz*s.reflectivity;
}

#define	Reflectivity	ReflectivityRefractiveIndex