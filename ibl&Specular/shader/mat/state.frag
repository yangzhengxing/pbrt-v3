#ifndef MSET_FRAGMENT_STATE_H
#define MSET_FRAGMENT_STATE_H

struct	FragmentState
{
	//inputs
	vec3	vertexPosition;
	vec3	vertexEye;
	float	vertexEyeDistance;
	vec2	vertexTexCoord;
	vec2	vertexTexCoordSecondary;
	vec4	vertexColor;
	vec3	vertexNormal;
	vec3	vertexTangent;
	vec3	vertexBitangent;
	vec2	screenTexCoord;
	float	screenDepth;

	//state
	vec3	shadow;
	vec4	albedo;
	vec3	normal;
	float	gloss;
	vec3	reflectivity;
	vec3	fresnel;
	vec3	diffuseLight;
	vec3	specularLight;
	vec3	emissiveLight;
	vec4	generic;

	//final outputs
	vec4	output0;
	vec4	output1;
	vec4	output2;
	vec4	output3;
};

#endif