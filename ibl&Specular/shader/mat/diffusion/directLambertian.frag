#include "data/shader/mat/state.frag"
#include "data/shader/mat/other/directLightParams.sh"

void	DiffusionLambertianDirect( inout FragmentState s )
{
	LightParams l = getLight( s.vertexPosition );
	adjustAreaLightDiffuse( l, s.vertexPosition );
	
	float lambert = (1.0/3.1415926) * saturate( dot(s.normal, l.direction) );

	s.diffuseLight =	(lambert * l.attenuation) *
						(l.color * s.shadow) *
						s.albedo.xyz;
}

#define	Diffusion	DiffusionLambertianDirect