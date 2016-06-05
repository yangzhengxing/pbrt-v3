#include "state.frag"

uniform vec3	uLightSpaceCameraPosition;
uniform vec4	uScreenTexCoordScaleBias;

BEGIN_PARAMS
	INPUT0(vec3,fPosition)
	INPUT1(vec4,fColor)
	INPUT2(vec3,fTangent)
	INPUT3(vec3,fBitangent)
	INPUT4(vec3,fNormal)
	INPUT5(vec4,fTexCoord)

	OUTPUT_COLOR0(vec4)
	#ifdef USE_OUTPUT1
		OUTPUT_COLOR1(vec4)
	#endif
	#ifdef USE_OUTPUT2
		OUTPUT_COLOR2(vec4)
	#endif
	#ifdef USE_OUTPUT3
		OUTPUT_COLOR3(vec4)
	#endif
END_PARAMS
{
	//default state values
	FragmentState state;
	state.vertexPosition = fPosition;
	vec3 eye = uLightSpaceCameraPosition - state.vertexPosition;
	state.vertexEye = normalize( eye );
	state.vertexEyeDistance = length( eye );
	state.vertexColor = fColor;
	state.vertexNormal = IN_FRONTFACING ? fNormal : -fNormal;
	state.vertexTangent = fTangent;
	state.vertexBitangent = fBitangent;
	state.vertexTexCoord = fTexCoord.xy;
	state.vertexTexCoordSecondary = fTexCoord.zw;
	state.screenTexCoord = IN_POSITION.xy * uScreenTexCoordScaleBias.xy + uScreenTexCoordScaleBias.zw;
	state.screenDepth = IN_POSITION.z;
	state.shadow = vec3(1.0,1.0,1.0);
	state.albedo = vec4(1.0,1.0,1.0,1.0);
	state.normal = normalize( state.vertexNormal );
	state.gloss = 0.5;
	state.reflectivity =
	state.fresnel = vec3(1.0,1.0,1.0);
	state.diffuseLight =
	state.specularLight =
	state.emissiveLight = vec3(0.0,0.0,0.0);
	state.generic = vec4(0.0,0.0,0.0,0.0);
	state.output0 =
	state.output1 =
	state.output2 =
	state.output3 = vec4(0.0,0.0,0.0,0.0);

	#ifdef Premerge
		Premerge(state);
	#endif

	#ifdef Surface
		Surface(state);
	#endif

	#ifdef Microsurface
		Microsurface(state);
	#endif

	#ifdef Albedo
		Albedo(state);
	#endif

	#ifdef Reflectivity
		Reflectivity(state);
	#endif

	#ifdef Diffusion
		Diffusion(state);
	#endif

	#ifdef Reflection
		Reflection(state);
	#endif

	#ifdef ReflectionSecondary
		ReflectionSecondary(state);
	#endif

	#ifdef Emissive
		Emissive(state);
	#endif

	#ifdef Occlusion
		Occlusion(state);
	#endif

	#ifdef Transparency
		Transparency(state);
	#endif

	#ifdef Merge
		Merge(state);
	#endif

	OUT_COLOR0 = state.output0;

	#ifdef USE_OUTPUT1
		OUT_COLOR1 = state.output1;
	#endif

	#ifdef USE_OUTPUT2
		OUT_COLOR2 = state.output2;
	#endif

	#ifdef USE_OUTPUT3
		OUT_COLOR3 = state.output3;
	#endif
}