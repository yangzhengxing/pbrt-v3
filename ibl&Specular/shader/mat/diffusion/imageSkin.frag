#include "data/shader/mat/state.frag"
#include "data/shader/mat/other/occlusionParams.sh"
#include "data/shader/mat/other/normalUtil.sh"
#include "data/shader/mat/other/shUtil.sh"
#include "data/shader/mat/other/scatterUtil.sh"
#include "paramsSkin.sh"

uniform vec4	uDiffuseLightSphere[9];

void	DiffusionSkinImage( inout FragmentState s )
{
	SkinParams skin;
	sampleSkinParams(skin, s);	

	//NOTE: This is all it takes to turn IBL skin into IBL Lambert
	skin.subdermisColor *= skin.skinMix;
	
	//AMBIENT OCCLUSION
	float occ = sampleOcclusion(s);
	vec3 AO = vec3(occ,occ,occ);
	vec3 softAO = vec3(0.0,0.0,0.0);
	
	vec4 noise = texture2DLod( tNoise, s.screenTexCoord * uNoiseScaleBias.xy + uNoiseScaleBias.zw, 0.0 );
	noise = 2.0*noise - vec4(1.0,1.0,1.0,1.0);
	noise /= s.vertexEyeDistance;
	
	float aoDepth = 0.5 * skin.blurScale * skin.shadowBlur;
	HINT_UNROLL for(int i=0; i<SAMPLE_COUNT; ++i)
	{
		vec2 k = uKernel[i].xy * aoDepth;		
		vec2 offset = (noise.xy*k.x) + noise.zw*k.y;
		softAO += sampleOcclusion(s, offset);
	}
	softAO *= INV_SAMPLE_COUNT;


	//SUBDERMIS
	//smoothed-normal SH lookup
	vec3 skin1, skin2;
	//l = 0 band (constant)
	vec3 diff0 = uDiffuseLightSphere[0].xyz;

	//l = 1 band
	skin1 = uDiffuseLightSphere[1].xyz * skin.smoothNormal.y;
	skin1 += uDiffuseLightSphere[2].xyz * skin.smoothNormal.z;
	skin1 += uDiffuseLightSphere[3].xyz * skin.smoothNormal.x;

	//l = 2 band
	vec3 swz = skin.smoothNormal.yyz * skin.smoothNormal.xzx;
	skin2 = uDiffuseLightSphere[4].xyz * swz.x;
	skin2 += uDiffuseLightSphere[5].xyz * swz.y;
	skin2 += uDiffuseLightSphere[7].xyz * swz.z;
	vec3 sqr = skin.smoothNormal * skin.smoothNormal;
	skin2 += uDiffuseLightSphere[6].xyz * ( 3.0*sqr.z - 1.0 );
	skin2 += uDiffuseLightSphere[8].xyz * ( sqr.x - sqr.y );
	
	vec3 spectrum = skin.subdermisColor * skin.subdermisScatter;
	vec3 subdermis = convolveSH3(diff0, skin1, skin2, spectrum);

	vec3 darkAO = softAO * AO;	
	softAO = 1.0-softAO;
	softAO *= softAO;
	softAO = 1.0-softAO;
	softAO = lerp(darkAO, softAO, spectrum);
	subdermis *= lerp(AO, softAO, skin.skinMix);
	

	//TRANSLUCENCY
	vec3 negN = -skin.smoothNormal;
	vec3 trans1, trans2;
	//l = 1 band
	trans1 = uDiffuseLightSphere[1].xyz * negN.y;
	trans1 += uDiffuseLightSphere[2].xyz * negN.z;
	trans1 += uDiffuseLightSphere[3].xyz * negN.x;

	//l = 2 band
	swz = negN.yyz * negN.xzx;
	trans2 = uDiffuseLightSphere[4].xyz * swz.x;
	trans2 += uDiffuseLightSphere[5].xyz * swz.y;
	trans2 += uDiffuseLightSphere[7].xyz * swz.z;
	sqr = negN * negN;
	trans2 += uDiffuseLightSphere[6].xyz * ( 3.0*sqr.z - 1.0 );
	trans2 += uDiffuseLightSphere[8].xyz * ( sqr.x - sqr.y );
	
	vec3 transLight = doubleConvolveSH(diff0, trans1, trans2, skin.translucencyScatter);
	transLight *= skin.translucencyColor;


	//PEACH-FUZZ
	vec3 E = s.vertexEye;
	float eyeDP = dot(E, skin.smoothNormal);
	vec3 peachLight = diff0 + skin1 + skin2;
	peachLight *= diffuseFresnel3(eyeDP, skin.fresnelScatter, softAO, skin.fresnelOcc);
	peachLight *= skin.fresnelColor;
	float wet = saturate(1.0 - uMaskWithGloss * s.gloss);
	peachLight *= wet*wet;

	
	//COMPOSITE
	s.diffuseLight = s.albedo.rgb * subdermis;
	s.diffuseLight += (peachLight + transLight) * skin.skinMix;
}

#define	Diffusion	DiffusionSkinImage