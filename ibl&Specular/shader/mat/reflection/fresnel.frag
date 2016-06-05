#ifndef MSET_FRESNEL_H
#define MSET_FRESNEL_H

vec3	fresnel(	float cosTheta,
					vec3 reflectivity,
					vec3 fresnelStrength	)
{
	//schlick's fresnel approximation
	float f = saturate( 1.0 - cosTheta );
	float f2 = f*f; f *= f2 * f2;
	return mix( reflectivity, vec3(1.0,1.0,1.0), f*fresnelStrength );
}

#endif