#include "data/shader/mat/state.frag"

USE_TEXTURE2D(tMetalnessMap);

uniform vec2	uMetalnessScaleBias;
uniform vec4	uMetalnessSwizzle;

void	ReflectivityMetalness( inout FragmentState s )
{
	float m = dot( texture2D( tMetalnessMap, s.vertexTexCoord ), uMetalnessSwizzle );
	m = uMetalnessScaleBias.x * m + uMetalnessScaleBias.y;
	
	s.reflectivity = mix( vec3(0.04,0.04,0.04), s.albedo.xyz, m );
	s.albedo.xyz = s.albedo.xyz - m * s.albedo.xyz;
	s.fresnel = vec3( 1.0, 1.0, 1.0 );
}

#define	Reflectivity	ReflectivityMetalness