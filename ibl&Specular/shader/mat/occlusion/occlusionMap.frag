#include "data/shader/mat/state.frag"

#ifdef AMBIENT_OCCLUSION
	USE_TEXTURE2D(tAmbientOcclusionTexture);
	uniform vec4	uAmbientOcclusionSwizzle;
	uniform vec2	uAmbientOcclusionStrength;
	uniform float	uAmbientOcclusionUseSecondaryUV;
	uniform float	uAmbientOcclusionVertexEnable;
	uniform vec4	uAmbientOcclusionVertexSwizzle;
#endif

USE_TEXTURE2D(tCavityTexture);
uniform vec4	uCavitySwizzle;
uniform vec4	uCavityStrength;

void	OcclusionMap( inout FragmentState s )
{
	float diff = 1.0, spec = 1.0;
	#ifdef AMBIENT_OCCLUSION
		vec2 tc = mix( s.vertexTexCoord, s.vertexTexCoordSecondary, uAmbientOcclusionUseSecondaryUV );
		float ao = dot( texture2D( tAmbientOcclusionTexture, tc ), uAmbientOcclusionSwizzle );
		ao *= dot( s.vertexColor, uAmbientOcclusionVertexSwizzle ) + uAmbientOcclusionVertexEnable;
		ao = ao * uAmbientOcclusionStrength.x + uAmbientOcclusionStrength.y;
		diff = ao;
	#endif
	
	float cav = dot( texture2D( tCavityTexture, s.vertexTexCoord ), uCavitySwizzle );
	diff *= cav * uCavityStrength.x + uCavityStrength.y;
	spec *= cav * uCavityStrength.z + uCavityStrength.w;

	#ifdef OCCLUSION_EXPORT
		//export; apply to surface instead
		s.albedo.xyz *= diff;
		s.reflectivity *= spec;
	#else
		s.diffuseLight *= diff;
		s.specularLight *= spec;
	#endif
}

#define	Occlusion	OcclusionMap