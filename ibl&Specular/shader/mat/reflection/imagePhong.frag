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

#ifndef PHONG_HEADER
#define PHONG_HEADER
	uniform float	uPhongHorizonFade;
	uniform float	uPhongBrightness;
	uniform float	uPhongSecondaryHorizonFade;
	uniform float	uPhongSecondaryBrightness;
	//{ r1, r2, cos( 2*pi*r2 ), sin( 2*pi*r2 ) }
	uniform vec4	uPhongRands[SPECULAR_IMPORTANCE_SAMPLES];

	//returns a random hemisphere vector, with probabilty weighted to a pow() lobe of 'specExp'
	vec3	phongImportanceSample( vec4 r, float specExp )
	{		
		float cos_theta = pow( r.x, 1.0 / (specExp + 1.0) );
		float sin_theta = sqrt( 1.0 - cos_theta*cos_theta );
		float cos_phi = r.z;
		float sin_phi = r.w;
		return	vec3( cos_phi*sin_theta, sin_phi*sin_theta, cos_theta );
	}
#endif

#ifndef SPECULAR_SECONDARY
	#define	BlinnPhongFuncName	ReflectionBlinnPhong
	#define	Reflection			ReflectionBlinnPhong
#else
	#define	BlinnPhongFuncName	ReflectionSecondaryBlinnPhong
	#define	ReflectionSecondary	ReflectionSecondaryBlinnPhong
	#define uPhongHorizonFade	uPhongSecondaryHorizonFade
	#define uPhongBrightness	uPhongSecondaryBrightness
	uniform float				uPhongSecondaryGloss;
	uniform vec3				uPhongSecondaryIntensity;
	uniform vec3				uPhongSecondaryFresnel;
#endif

void	BlinnPhongFuncName( inout FragmentState s )
{
	/*
		Blinn-Phong BRDF (normalized):
		u := sample direction
		r := reflected view vector
		f(u,r) := (specExp+4)/(8*pi) * pow( dot(u,r), specExp )
	
		Probability distribution function is the normalized BRDF (integral(f(u,r))==1),
		but since we are using a proper normalized BRDF, they are the same.
		p(u,r) == f(u,r)

		-jdr
	*/
	
	//determine specular exponent from gloss map & settings
	float gloss = s.gloss;
	#ifdef SPECULAR_SECONDARY
		gloss = saturate( gloss * uPhongSecondaryGloss );
	#endif
	float specExp = -10.0 / log2( gloss*0.968 + 0.03 );
	specExp *= specExp;

	//sample the reflection map repeatedly, with an importance-based sample distribution
	vec3 basisX = normalize( cross( s.normal, vec3(0.0, 1.0, saturate(s.normal.y*10000.0 - 9999.0) ) ) );
	vec3 basisY = cross( basisX, s.normal );
	vec3 basisZ = s.normal;
	vec3 spec = vec3(0.0, 0.0, 0.0);

	HINT_UNROLL
	for( int i=0; i<SPECULAR_IMPORTANCE_SAMPLES; ++i )
	{
		vec4 r = uPhongRands[i];
		vec3 dir = phongImportanceSample(r, specExp);
		vec3 h = dir.x*basisX + dir.y*basisY + dir.z*basisZ;
		
		float pdf = (specExp + 4.0)/(8.0*3.14159) * pow( saturate( dot( h, s.normal ) ), specExp );
		float lod = (0.5 * log2( (256.0*256.0)/float(SPECULAR_IMPORTANCE_SAMPLES) ) + 0.5) - 0.5*log2( pdf );
		
		vec3 lookup = reflect( -s.vertexEye, h );
		spec += (1.0/float(SPECULAR_IMPORTANCE_SAMPLES)) * textureCubeLod( tReflectionCubeMap, lookup, lod ).xyz;
	}
	spec *= uPhongBrightness;

	//fresnel
	float glossAdjust = gloss*gloss;
	vec3 reflectivity = s.reflectivity, fresn = s.fresnel;
	#ifdef SPECULAR_SECONDARY
		reflectivity *= uPhongSecondaryIntensity;
		fresn = uPhongSecondaryFresnel;
	#endif
	spec *= fresnel(	dot( s.vertexEye, s.normal ),
						reflectivity,
						fresn * glossAdjust	);
	
	//mask for local reflections
	spec *= texture2D( tLocalReflectionMap, s.screenTexCoord ).x;

	//horizon
	vec3 r = reflect( -s.vertexEye, s.normal );
	float horiz = dot( r, s.vertexNormal );
	horiz = saturate( 1.0 + uPhongHorizonFade*horiz );
	horiz *= horiz;
	spec *= horiz;

	//add our contribution
	s.specularLight += spec;
}

#undef BlinnPhongFuncName