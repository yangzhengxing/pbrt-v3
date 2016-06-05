#include "data/shader/mat/state.frag"
#include "data/shader/mat/other/directLightParams.sh"
#include "data/shader/mat/other/scatterUtil.sh"
#include "paramsMicrofiber.sh"

void	DiffusionMicrofiberDirect( inout FragmentState s )
{
	LightParams l = getLight( s.vertexPosition );
	adjustAreaLightDiffuse( l, s.vertexPosition );

	float NdotL = dot(s.normal, l.direction);
	float lambert = (1.0/3.1415926) * saturate( NdotL );

	s.diffuseLight = lambert * s.albedo.xyz;

	//PEACH-FUZZ
	vec4 fuzzMap = texture2D( tMicrofiberMap, s.vertexTexCoord );
	
	float eyeDP = dot( s.vertexEye, s.normal );	
	float wrapOcc = 0.5*uMicrofiberScatter;
	wrapOcc = wrapLight(NdotL, wrapOcc) * wrapLightIntegral(wrapOcc);
	vec3 fuzzLight = diffuseFresnel3( eyeDP, uMicrofiberScatter, s.shadow, uMicrofiberOcc );
	fuzzLight *= wrapOcc;
	fuzzLight *= uMicrofiberColor * fuzzMap.rgb;

	//occlude by high gloss values, wet cloth is not fuzzy!
	float wet = saturate(1.0 - uMaskWithGloss * s.gloss);
	fuzzLight *= wet*wet;

	s.diffuseLight += fuzzLight;

	s.diffuseLight *= s.shadow * l.attenuation * l.color;
}

#define	Diffusion	DiffusionMicrofiberDirect