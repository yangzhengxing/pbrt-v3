#ifndef MSET_NORMAL_UTIL_SH
#define MSET_NORMAL_UTIL_SH

vec3 sampleNormalMap(float2 texcoord)
{
	#ifdef tNormalMap_present
		vec3 n = texture2D(tNormalMap, texcoord).xyz;
		n = uNormalMapScale*n + uNormalMapBias;
		return n;
	#else
		return vec3(0.5,0.5,1.0).xyz;
	#endif
}

vec3 smoothSampleNormalMap(float2 texcoord, float blur) 
{
	#ifdef tNormalMap_present
		vec3 n = texture2DLod(tNormalMap, texcoord, blur*6.0).xyz;
		n = uNormalMapScale*n + uNormalMapBias;
		return n;
	#else
		return vec3(0.5,0.5,1.0).xyz;
	#endif	
}

vec3 tangentToObject(FragmentState s, vec3 n) 
{
	vec3 T = s.vertexTangent;
	vec3 B = s.vertexBitangent;
	vec3 N = s.vertexNormal;

	//ortho-normalization of tangent basis
	N = normalize(N);
	T -= dot(T,N)*N;
	T = normalize(T);
	B -= dot(B,N)*N + dot(B,T)*T;
	B = normalize(B);
	
	n =	n.x * T +
		n.y * B +
		n.z * N;

	return normalize(n);
}

#endif