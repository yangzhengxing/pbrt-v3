#include "data/shader/mat/state.frag"

USE_TEXTURE2D(tNormalMap);
#define tNormalMap_present

uniform vec3	uNormalMapScale; //typically 2,2,2
uniform	vec3	uNormalMapBias; //typically -1,-1,-1
uniform vec3	uNormalMapParams; //{ renormalize, orthoganalize, regenBitangent }

void	SurfaceNormalMap( inout FragmentState s )
{
	//sample and scale/bias the normal map
	vec4 nsamp = texture2D( tNormalMap, s.vertexTexCoord );
	vec3 n = uNormalMapScale*nsamp.xyz + uNormalMapBias;
	
	vec3 T = s.vertexTangent;
	vec3 B = s.vertexBitangent;
	vec3 N = s.vertexNormal;

	//ortho-normalization
	float renormalize = uNormalMapParams.x, orthogonalize = uNormalMapParams.y;
	N = mix( N, normalize(N), renormalize );
	T -= (orthogonalize * dot(T,N)) * N;
	T = mix( T, normalize(T), renormalize );
	B -= orthogonalize * (dot(B,N)*N + dot(B,T)*T);
	B = mix( B, normalize(B), renormalize );

	//regenerate bitangent
	vec3 B2 = cross( N, T );
	B2 = dot(B2,B) < 0.0 ? -B2 : B2;
	B = mix( B, B2, uNormalMapParams.z );
	
	//store our results
	s.normal = normalize( n.x*T + n.y*B + n.z*N );
	s.vertexTangent = T;
	s.vertexBitangent = B;
	s.vertexNormal = N;
	s.albedo.a = nsamp.a;
}

#define	Surface	SurfaceNormalMap