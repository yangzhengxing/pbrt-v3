#ifdef SPECULAR_SECONDARY
	uniform float	uAnisoSecondaryHorizonFade;
	uniform float	uAnisoSecondaryBrightness;
	USE_TEXTURE2D(	tAnisoSecondaryDirectionMap	);
	uniform vec3	uAnisoSecondaryDirectionMapScale;
	uniform	vec3	uAnisoSecondaryDirectionMapBias;
	uniform float	uAnisoSecondaryDirectionMapSwizzle;
	uniform vec3	uAnisoSecondaryDirectionConst;
	uniform float	uAnisoSecondarySpread;
	
	#define	uAnisoHorizonFade			uAnisoSecondaryHorizonFade
	#define	uAnisoBrightness			uAnisoSecondaryBrightness
	#define	tAnisoDirectionMap			tAnisoSecondaryDirectionMap
	#define	uAnisoDirectionMapScale		uAnisoSecondaryDirectionMapScale
	#define	uAnisoDirectionMapBias		uAnisoSecondaryDirectionMapBias
	#define	uAnisoDirectionMapSwizzle	uAnisoSecondaryDirectionMapSwizzle
	#define	uAnisoDirectionConst		uAnisoSecondaryDirectionConst
	#define	uAnisoSpread				uAnisoSecondarySpread
	
	uniform vec3	uAnisoSecondaryColor;
	uniform float	uAnisoSecondaryGloss;
	uniform vec3	uAnisoSecondaryFresnel;
	uniform float	uAnisoSecondaryShift;

	#ifdef SampleAnisoTangent
		#undef SampleAnisoTangent
		#undef SampleAnisoTangentName
	#endif
	#define	SampleAnisoTangentName	SampleAnisoTangent2
	#define	SampleAnisoTangent		SampleAnisoTangent2
#else
	uniform float	uAnisoHorizonFade;
	uniform float	uAnisoBrightness;
	USE_TEXTURE2D(	tAnisoDirectionMap	);
	uniform vec3	uAnisoDirectionMapScale;
	uniform	vec3	uAnisoDirectionMapBias;
	uniform float	uAnisoDirectionMapSwizzle;
	uniform vec3	uAnisoDirectionConst;
	uniform float	uAnisoSpread;

	#define	SampleAnisoTangentName	SampleAnisoTangent1
	#define	SampleAnisoTangent		SampleAnisoTangent1
#endif

void	SampleAnisoTangentName( FragmentState s, out vec3 tangent, out vec3 bitangent )
{
	//Direction
	tangent = texture2D( tAnisoDirectionMap, s.vertexTexCoord ).xyz;
	tangent = uAnisoDirectionMapScale*tangent + uAnisoDirectionMapBias;

	//zero if a tangent map is present
	tangent += uAnisoDirectionConst;

	//swizzle tangent and binormal directions
	tangent.xy = mix(tangent.xy, tangent.yx, uAnisoDirectionMapSwizzle);

	//transform into render space
	tangent = tangent.x * s.vertexTangent +
				tangent.y * s.vertexBitangent +
				tangent.z * s.vertexNormal;
	
	//project tangent onto normal plane
	tangent = tangent - s.normal*dot( tangent, s.normal );
	tangent = normalize( tangent );
	bitangent = normalize( cross( s.normal, tangent ) );
}

#ifndef PARAMS_ANISOTROPIC_H
#define	PARAMS_ANISOTROPIC_H

#ifdef ANISO_IMPORTANCE_SAMPLES
	//{ r1, r2, cos( 2*pi*r2 ), sin( 2*pi*r2 ) }
	uniform vec4	uAnisoRands[ANISO_IMPORTANCE_SAMPLES];

	//returns a random hemisphere vector, with probabilty weighted to a pow() lobe of 'specExp'
	vec3	anisoImportanceSampleDirection( vec4 r, float specExp )
	{		
		float cos_theta = pow( r.x, 1.0 / (specExp + 1.0) );
		float sin_theta = sqrt( 1.0 - cos_theta*cos_theta );
		float cos_phi = r.z;
		float sin_phi = r.w;
		return	vec3( cos_phi*sin_theta, sin_phi*sin_theta, cos_theta );
	}

	float computeAnisoLOD( float specExp, vec3 H, vec3 N )
	{
		float pdf = (specExp + 4.0)/(8.0*3.14159) * pow( saturate( dot( H, N ) ), specExp );		
		return 0.5 * log2( (256.0*256.0)/float(ANISO_IMPORTANCE_SAMPLES) ) - 0.5 * log2( pdf ) + 0.5;
	}
#endif

#endif