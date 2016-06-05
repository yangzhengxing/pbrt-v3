#include "data/shader/mat/state.frag"

USE_TEXTURE2D(tAlbedoMap);
uniform vec3	uAlbedoMapColor;

void	AlbedoMap( inout FragmentState s )
{
	s.albedo = texture2D( tAlbedoMap, s.vertexTexCoord );
	s.albedo.xyz *= uAlbedoMapColor;
}

#define	Albedo	AlbedoMap