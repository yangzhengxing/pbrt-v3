#include "data/shader/mat/state.frag"
#include "fresnel.frag"

#ifndef tReflectionCubeMap_Present
	USE_TEXTURECUBE(tReflectionCubeMap);
	#define	tReflectionCubeMap_Present
#endif

#ifndef tLocalReflectionMap_Present
	#define	tLocalReflectionMap_Present
	USE_TEXTURE2D(tLocalReflectionMap);
#endif

#ifndef GGX_HEADER
#define GGX_HEADER
	uniform float	uGGXHorizonFade;
	uniform float	uGGXBrightness;
	uniform float	uGGXSecondaryHorizonFade;
	uniform float	uGGXSecondaryBrightness;
	uniform vec4	uGGXRands[GGX_IMPORTANCE_SAMPLES]; //{ r1, r2, cos( 2*pi*r2 ), sin( 2*pi*r2 ) }

	vec3	ImportanceSampleGGX( vec4 r, float a2 )
	{
		float cosTheta = sqrt( (1.0 - r.x) / ((a2 - 1.0) * r.x + 1.0) );
		float sinTheta = sqrt( 1.0 - cosTheta * cosTheta );
		float cosPhi = r.z;
		float sinPhi = r.w;
		return vec3( cosPhi*sinTheta, sinPhi*sinTheta, cosTheta );
	}

	float	G_Smith( float a2, float Cos )
	{
		return (2.0 * Cos) / (Cos + sqrt(a2 + (1.0 - a2) * (Cos * Cos)));
	}

#endif

#ifndef SPECULAR_SECONDARY
	#define	GGXFuncName			ReflectionGGX
	#define	Reflection			ReflectionGGX
#else
	#define	GGXFuncName	        ReflectionSecondaryGGX
	#define	ReflectionSecondary	ReflectionSecondaryGGX
	#define uGGXHorizonFade	    uGGXSecondaryHorizonFade
	#define uGGXBrightness	    uGGXSecondaryBrightness
	uniform float				uGGXSecondaryGloss;
	uniform vec3				uGGXSecondaryIntensity;
	uniform vec3				uGGXSecondaryFresnel;
#endif

void GGXFuncName( inout FragmentState s )
{
	float roughness = 1.0 - s.gloss;
	#ifdef SPECULAR_SECONDARY
		roughness = saturate( roughness - roughness*uGGXSecondaryGloss );
	#endif
	float a = max( roughness * roughness, 5e-4 );
	float a2 = a*a;
    float k = a * 0.5;

	vec3 basisX = normalize( cross( s.normal, vec3(0.0, 1.0, saturate(s.normal.y*10000.0 - 9999.0) ) ) );
	vec3 basisY = cross( basisX, s.normal );
	vec3 basisZ = s.normal;

	vec3 reflectivity = s.reflectivity, fresn = s.fresnel;
	#ifdef SPECULAR_SECONDARY
		reflectivity *= uGGXSecondaryIntensity;
		fresn = uGGXSecondaryFresnel;
	#endif    
	
	vec3 spec = vec3(0.0, 0.0, 0.0);
	HINT_UNROLL
	for( int i=0; i<GGX_IMPORTANCE_SAMPLES; i++ )
	{
		vec3 dir = ImportanceSampleGGX( uGGXRands[i], a2 );
		vec3 H = dir.x*basisX + dir.y*basisY + dir.z*basisZ;
		vec3 L = (2.0 * dot( s.vertexEye, H )) * H - s.vertexEye;
		
		float NdotH = saturate( dot(s.normal, H) );
		float NdotL = saturate( dot(s.normal, L) );
		float NdotV = saturate( dot( s.normal, s.vertexEye) );
		float VdotH = saturate( dot( s.vertexEye, H) );
		
        float d = ( NdotH * a2 - NdotH ) * NdotH + 1.0;
	    float pdf = (NdotH * a2) / (4.0 * 3.141593 * d*d * VdotH);

		float lod = (0.5 * log2( (256.0*256.0)/float(GGX_IMPORTANCE_SAMPLES) ) + 1.5*s.gloss*s.gloss) - 0.5*log2( pdf );
		vec3 sampleCol = textureCubeLod( tReflectionCubeMap, L, lod ).xyz;

        float G = (G_Smith(a2, NdotL) * G_Smith(a2, max(1e-8,NdotV)));
        G *= VdotH / (NdotH * max(1e-8,NdotV));
		vec3 F = fresnel( VdotH, reflectivity, fresn );

		spec += sampleCol * F * (G * (1.0/float(GGX_IMPORTANCE_SAMPLES)));
	}
	spec *= uGGXBrightness;

	//mask for local reflections
	spec *= texture2D( tLocalReflectionMap, s.screenTexCoord ).x;

	//horizon
	vec3 r = reflect( -s.vertexEye, s.normal );
	float horiz = dot( r, s.vertexNormal );
	horiz = saturate( 1.0 + uGGXHorizonFade*horiz );
	horiz *= horiz;
	spec *= horiz;

	//add our contribution
	s.specularLight += spec;
}

#undef GGXFuncName