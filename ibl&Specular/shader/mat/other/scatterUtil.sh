#ifndef MSET_SCATTER_UTIL_SH
#define MSET_SCATTER_UTIL_SH

float wrapLight(float DP, float scatter)
{
	float res = saturate( DP*(1.0-scatter) + scatter );
	return res;
}
vec3 wrapLight3(float DP, vec3 scatter)
{
	vec3 res = saturate( DP*(vec3(1.0,1.0,1.0)-scatter) + scatter );
	return res;
}

float wrapLightIntegral(float scatter)
{
	return (1.0 / 3.14159) * (1.0 - scatter);
}
vec3 wrapLightIntegral3(vec3 scatter)
{
	return (1.0 / 3.14159) * (vec3(1.0,1.0,1.0)-scatter);
}

float diffuseFresnel(float eyeDP, float scatter, float occ, float occWeight)
{
	eyeDP = 1.0 - eyeDP;
	float dp4 = eyeDP * eyeDP; dp4 *= dp4;
	eyeDP = lerp(dp4, eyeDP*0.4, scatter);		//0.4 is energy conserving integral
	return lerp(eyeDP, eyeDP*occ, occWeight);	//occlude with occ term
}
vec3 diffuseFresnel3(float eyeDP, float scatter, vec3 occ, float occWeight)
{
	eyeDP = 1.0 - eyeDP;
	float dp4 = eyeDP * eyeDP; dp4 *= dp4;
	eyeDP = lerp(dp4, eyeDP*0.4, scatter);		//0.4 is energy conserving integral
	return lerp(vec3(eyeDP,eyeDP,eyeDP), eyeDP*occ, occWeight);	//occlude with occ term
}

#endif
