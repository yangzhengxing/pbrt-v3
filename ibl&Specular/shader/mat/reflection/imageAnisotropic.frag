#include "data/shader/mat/state.frag"
#include "fresnel.frag"
#include "data/shader/common/util.sh"
#include "paramsAnisotropic.sh"

#ifndef tReflectionCubeMap_Present
	USE_TEXTURECUBE(tReflectionCubeMap);
	#define	tReflectionCubeMap_Present
#endif

#ifndef tLocalReflectionMap_Present
	#define	tLocalReflectionMap_Present
	USE_TEXTURE2D(tLocalReflectionMap);
#endif

#ifndef SPECULAR_SECONDARY
	#define	AnisotropicFuncName	ReflectionAnisotropic
	#define	Reflection			ReflectionAnisotropic
#else
	#define	AnisotropicFuncName	ReflectionSecondaryAnisotropic
	#define	ReflectionSecondary	ReflectionSecondaryAnisotropic
#endif

void	AnisotropicFuncName( inout FragmentState s )
{
	#ifdef SPECULAR_SECONDARY
		float gloss = saturate( s.gloss * uAnisoSecondaryGloss );
		float anisoSpread = uAnisoSecondarySpread;
	#else 
		float gloss = s.gloss;
		float anisoSpread = uAnisoSpread;
	#endif

	//determine specular exponent from gloss map & settings
	float specExp = -10.0 / log2( gloss*0.968 + 0.03 );
	specExp *= specExp;

	//something happens to the importance samples at exp=16 and there's a noticeable jump --Andres
	specExp = max(16.1,specExp);

	//aniso
	vec3 N = s.normal;
	vec3 T, B; SampleAnisoTangent( s, T, B );
	vec3 E = -s.vertexEye;
	
	#ifdef SPECULAR_SECONDARY
		N = normalize(N + T * uAnisoSecondaryShift * 0.5);
		T = normalize(cross(B,N));
	#endif
	vec3 R = reflect(E,N);
		
	//sample the reflection map repeatedly, with an importance-based sample distribution
	vec3 basisX = normalize( cross( N, vec3(0.0, 1.0, saturate(N.y*10000.0 - 9999.0) ) ) );
	vec3 basisY = cross( basisX, N );
	vec3 basisZ = N;

	vec3 spec = vec3(0.0, 0.0, 0.0);

	float anisoExp = 16.0;
	anisoSpread = max(0.01, anisoSpread);	
	float invSampleCount = 1.0/float(ANISO_IMPORTANCE_SAMPLES-1);

	vec3 dB = B;
	vec3 dT = T;

	HINT_LOOP
	for( int i=0; i<ANISO_IMPORTANCE_SAMPLES; ++i )
	{
		vec4 r = uAnisoRands[i];
		float ct = 1.0;
		float st = 0.0;
		float cp = 0.0;
		float sp = 1.0;
		vec3 zero = vec3(cp*st, sp*st, ct);

		vec3 dirSpec =  anisoImportanceSampleDirection(r, specExp);
		vec3 dirAniso = anisoImportanceSampleDirection(r, anisoExp);

		//dir into world-space
		dirSpec =  dirSpec.x*basisX +  dirSpec.y*basisY +  dirSpec.z*basisZ;
		dirAniso = dirAniso.x*basisX + dirAniso.y*basisY + dirAniso.z*basisZ;
		
		vec3 iT = vec3(T.x,B.x,N.x);
		vec3 iB = vec3(T.y,B.y,N.y);
		vec3 iN = vec3(T.z,B.z,N.z);

		//dir into tangent space
		vec3 dirCombined;
		dirCombined = iT*dirSpec.x +  iB*dirSpec.y +  iN*dirSpec.z;
		dirAniso =	  iT*dirAniso.x + iB*dirAniso.y + iN*dirAniso.z;
		
		//bias the binormal components of dir by anisoSpread
		float lodMix = abs(dirAniso.y - dirCombined.y) * anisoSpread;
		dirCombined.y = mix(dirCombined.y, dirAniso.y, anisoSpread);

		//combined dir out of tangent space
		vec3 hAniso = normalize(T*dirCombined.x + B*dirCombined.y + N*dirCombined.z);
		vec3 hSpec = dirSpec;
		
		//compute aniso filtering scale, cannot exceed 0.5 or cubemap borders bleed nonsense into the lookups
		float lodSpec =  computeAnisoLOD(specExp, hSpec, N);
		lodSpec =  min(saturate(lodSpec / 16.0), 0.4);
		float lodAniso = min(0.15*anisoSpread + lodSpec, 0.4);

		dirSpec = reflect(E, hSpec);
		dirAniso = reflect(E, hAniso);
		vec3 lookup = dirAniso;
		
		//aniso filtering must happen along axes perpendicular to reflection, which is different every sample
		//TODO: 64x normalize? This is gross >_<!
		dB = normalize(dirAniso-dirSpec);
		dT = normalize(cross(dB,R));
		spec += textureCubeGrad(tReflectionCubeMap, lookup, dT*lodSpec, dB*lodAniso ).xyz;
	}
	spec *= invSampleCount;
	spec *= uAnisoBrightness;

	//fresnel
	float glossAdjust = gloss*gloss;
	vec3 reflectivity = s.reflectivity, fresn = s.fresnel;
	#ifdef SPECULAR_SECONDARY
		reflectivity *= uAnisoSecondaryColor;
		fresn = uAnisoSecondaryFresnel;
	#endif
	spec *= fresnel(	dot(s.vertexEye, N),
						reflectivity,
						fresn * glossAdjust	);

	//mask for local reflections
	spec *= texture2D( tLocalReflectionMap, s.screenTexCoord ).x;

	//horizon test, reflection vector should quickly fade once it points under the surface
	vec3 r = reflect( -s.vertexEye, N );
	float horiz = dot( r, s.vertexNormal );
	horiz = saturate( 1.0 + uAnisoHorizonFade*horiz );
	horiz *= horiz;
	spec *= horiz;

	//add our contribution
	s.specularLight += spec;
}

#undef AnisotropicFuncName