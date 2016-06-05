#include "data/shader/mat/state.frag"

USE_TEXTURE2D(tDotaMask2);

uniform float	uDotaSpecularExponent;
uniform vec3	uDota2SpecularScale;
uniform vec3	uDota2RimLightScale;
uniform vec4	uDotaMask2Enable;

void	ReflectivityDota2( inout FragmentState s )
{
	//pass through values
	#ifdef AlbedoDota_Present
		float metalness = s.generic.y;
		float rimFresnel = s.generic.z;
		float reflFresnel = s.generic.w;
	#else
		float metalness = 0.0;
		float rimFresnel = pow( saturate(1.0 - dot(s.normal,s.vertexEye)), 5.0 );
		float reflFresnel = 0.05 + 0.95*rimFresnel;
	#endif

	//dota mask 2
	vec4 mask2 = texture2D( tDotaMask2, s.vertexTexCoord );
	mask2 = mix( vec4(1.0,1.0,1.0,1.0), mask2, uDotaMask2Enable );
	
	//reflectivity
	s.reflectivity = mix( s.albedo.xyz, vec3(1.0,1.0,1.0), mask2.b );
	s.reflectivity *= uDota2SpecularScale;
	s.reflectivity *= mask2.r * max( reflFresnel, metalness );
	s.fresnel = vec3(0.0,0.0,0.0);

	//convert phong exponent to marmoset gloss
	float specExp = mask2.a * uDotaSpecularExponent;
	s.gloss = exp2( 10.0 * rsqrt(4.0*specExp + 0.01) );
	
	//rim lighting
	float rim = saturate( rimFresnel * mask2.g * s.normal.y );
	rim = rim - rim*metalness;
	s.specularLight += rim * uDota2RimLightScale;
}

#define	Reflectivity	ReflectivityDota2