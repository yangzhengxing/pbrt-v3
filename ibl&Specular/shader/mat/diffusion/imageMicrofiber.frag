#include "data/shader/mat/state.frag"
#include "data/shader/mat/other/occlusionParams.sh"
#include "data/shader/mat/other/scatterUtil.sh"
#include "paramsMicrofiber.sh"

uniform vec4	uDiffuseLightSphere[9];

void	DiffusionMicrofiberImage( inout FragmentState s )
{
	//l = 0 band
	vec3 diff0, diff1, diff2;
	diff0 = uDiffuseLightSphere[0].xyz;

	//l = 1 band
	diff1 =  uDiffuseLightSphere[1].xyz * s.normal.y;
	diff1 += uDiffuseLightSphere[2].xyz * s.normal.z;
	diff1 += uDiffuseLightSphere[3].xyz * s.normal.x;

	//l = 2 band
	vec3 swz = s.normal.yyz * s.normal.xzx;
	diff2 =  uDiffuseLightSphere[4].xyz * swz.x;
	diff2 += uDiffuseLightSphere[5].xyz * swz.y;
	diff2 += uDiffuseLightSphere[7].xyz * swz.z;

	vec3 sqr = s.normal * s.normal;
	diff2 += uDiffuseLightSphere[6].xyz * ( 3.0*sqr.z - 1.0 );
	diff2 += uDiffuseLightSphere[8].xyz * ( sqr.x - sqr.y );

	s.diffuseLight = diff0 + diff1 + diff2;
	s.diffuseLight *= s.albedo.xyz;
	
	//ambient occlusion
	float AO = sampleOcclusion( s );
	s.diffuseLight *= AO;
	
	//PEACH-FUZZ
	vec4 fuzzMap = texture2D( tMicrofiberMap, s.vertexTexCoord );
	
	float eyeDP = dot( s.vertexEye, s.normal );
	vec3 fuzzLight = diff0 + diff1 + diff2;
	fuzzLight *= diffuseFresnel( eyeDP, uMicrofiberScatter, AO, uMicrofiberOcc );
	float wet = saturate(1.0 - s.gloss*uMaskWithGloss);
	fuzzLight *= wet*wet;
	
	s.diffuseLight += fuzzLight * uMicrofiberColor * fuzzMap.rgb;
}

#define	Diffusion	DiffusionMicrofiberImage