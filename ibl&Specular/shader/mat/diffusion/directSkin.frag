#include "data/shader/mat/state.frag"
#include "data/shader/mat/other/directLightParams.sh"
#include "data/shader/mat/other/shadowParams.sh"
#include "data/shader/mat/other/normalUtil.sh"
#include "data/shader/mat/other/scatterUtil.sh"
#include "paramsSkin.sh"


void	DiffusionSkinDirect( inout FragmentState s )
{
	LightParams l = getLight( s.vertexPosition );
	adjustAreaLightDiffuse( l, s.vertexPosition );

	SkinParams skin;
	sampleSkinParams( skin, s );

	//DIFFUSE
	//NOTE: no area lights, they mess with an already delicate balance. --Andres
	float DP = dot(l.direction, skin.normal);
	float diff = saturate(DP) * (1.0/3.1415926);

	//SUBDERMIS
	float smoothDP = dot(l.direction, skin.smoothNormal);
	vec3 subdermisSpectrum = skin.subdermisScatter * skin.subdermisColor;
	vec3 subdermisLight = wrapLight3(smoothDP, subdermisSpectrum);
	subdermisLight *= wrapLightIntegral3(subdermisSpectrum);
		
	//TRANSLUCENCY
	float tlwl = wrapLight(-smoothDP, skin.translucencyScatter);
	vec3 translucentLight = vec3(tlwl,tlwl,tlwl);
	translucentLight *= translucentLight * 1.25;
	translucentLight *= wrapLightIntegral(skin.translucencyScatter);
	translucentLight *= skin.translucencyColor;

	//SHADOW		
	float grazingAngle = 1.0-0.5*diff; //shadows get blurred more at grazing angles
	grazingAngle *= grazingAngle;
	float shadowDepth = 0.5 * grazingAngle * skin.blurScale;
	shadowDepth *= 3.0;   
    shadowDepth *= skin.shadowBlur;

	vec4 noise = texture2DLod( tNoise, s.screenTexCoord * uNoiseScaleBias.xy + uNoiseScaleBias.zw, 0.0 );
	noise = 2.0*noise - vec4(1.0,1.0,1.0,1.0);
	noise /= s.vertexEyeDistance;

	vec3 softShadow = vec3(0.0,0.0,0.0); //s.shadow;	
	vec3 superSoftShadow = vec3(0.0,0.0,0.0);	
	HINT_UNROLL for( int i=0; i<SAMPLE_COUNT; ++i )
	{
		vec2 k = uKernel[i].xy * shadowDepth;
		vec2 c = (s.screenTexCoord + noise.xy*k.x) + noise.zw*k.y;
		vec3 sample = sampleShadowMask(c);
		softShadow += sample * (1.0-float(i)*0.125);
		superSoftShadow += sample;
	}
	softShadow *= 8.0 / 28.0; // divide by sum(8-i, 0 to 7);
	superSoftShadow *= 0.125;
	superSoftShadow *= sqrt(superSoftShadow); // pow(1.5)
	softShadow = lerp(softShadow*softShadow, sqrt(softShadow), subdermisSpectrum);

	//PEACH-FUZZ
	vec3 E = s.vertexEye;
	float eyeDP = dot(E, skin.smoothNormal);
	float wrapOcc = 0.5*skin.fresnelScatter;
	wrapOcc = wrapLight(smoothDP, wrapOcc) * wrapLightIntegral(wrapOcc);
	vec3 peachLight = diffuseFresnel3(eyeDP, skin.fresnelScatter, softShadow, skin.fresnelOcc);
	peachLight *= wrapOcc;
	peachLight *= skin.fresnelColor;
	float wet = saturate(1.0 - uMaskWithGloss * s.gloss);
	peachLight *= wet*wet;

	//COMPOSITE
	vec3 skinLight = (s.albedo.rgb * subdermisLight) * softShadow + peachLight + translucentLight * superSoftShadow;
	vec3 lambLight = diff * (s.albedo.rgb * softShadow);
	s.diffuseLight = lerp(lambLight, skinLight, skin.skinMix);

	s.diffuseLight *= l.attenuation * l.color;
}

#define	Diffusion	DiffusionSkinDirect