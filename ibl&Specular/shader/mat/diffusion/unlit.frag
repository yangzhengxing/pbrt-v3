#include "data/shader/mat/state.frag"

void	DiffusionUnlit( inout FragmentState s )
{
	s.diffuseLight = s.albedo.xyz;
}

#define	Diffusion	DiffusionUnlit