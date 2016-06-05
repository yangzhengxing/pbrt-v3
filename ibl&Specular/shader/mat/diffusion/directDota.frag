#include "data/shader/mat/state.frag"
#include "data/shader/mat/other/directLightParams.sh"

USE_TEXTURE2D(tDotaDiffussionGradient);

uniform vec3	uLambert;

void	DiffusionDotaDirect( inout FragmentState s )
{
	LightParams l = getLight( s.vertexPosition );
	adjustAreaLightDiffuse( l, s.vertexPosition );
	
	//dota scales illumination by a user gradient (default is half-lambert)
	float NdotL = dot( l.direction, s.normal );
	vec3 illum = (1.0/3.1415926) * texture2D( tDotaDiffussionGradient, vec2( 0.5*NdotL + 0.5, s.generic.x ) ).xyz;

	s.diffuseLight =	l.attenuation *
						(illum * s.shadow) *
						(s.albedo.xyz * l.color);
}

#define	Diffusion	DiffusionDotaDirect