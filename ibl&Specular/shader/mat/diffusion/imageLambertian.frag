#include "data/shader/mat/state.frag"
#include "data/shader/mat/other/occlusionParams.sh"

uniform vec4	uDiffuseLightSphere[9];

void	DiffusionLambertianImage( inout FragmentState s )
{
	//l = 0 band
	s.diffuseLight = uDiffuseLightSphere[0].xyz;

	//l = 1 band
	s.diffuseLight += uDiffuseLightSphere[1].xyz * s.normal.y;
	s.diffuseLight += uDiffuseLightSphere[2].xyz * s.normal.z;
	s.diffuseLight += uDiffuseLightSphere[3].xyz * s.normal.x;

	//l = 2 band
	vec3 swz = s.normal.yyz * s.normal.xzx;
	s.diffuseLight += uDiffuseLightSphere[4].xyz * swz.x;
	s.diffuseLight += uDiffuseLightSphere[5].xyz * swz.y;
	s.diffuseLight += uDiffuseLightSphere[7].xyz * swz.z;

	vec3 sqr = s.normal * s.normal;
	s.diffuseLight += uDiffuseLightSphere[6].xyz * ( 3.0*sqr.z - 1.0 );
	s.diffuseLight += uDiffuseLightSphere[8].xyz * ( sqr.x - sqr.y );

	//ambient occlusion
	s.diffuseLight *= sampleOcclusion( s );

	//apply albedo
	s.diffuseLight *= s.albedo.xyz;
}

#define	Diffusion	DiffusionLambertianImage