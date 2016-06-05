#ifndef MSET_SHUTIL_SH
#define MSET_SHUTIL_SH

vec3 convolveSH(vec3 band0, vec3 band1, vec3 band2, float weight)
{
	// SH band weights that define diffuse convolution
	vec3 conv = lerp( vec3(1.0,1.0,1.0), vec3(1.0,0.6667,0.25), weight);
	return band0 + band1*conv.y + band2*conv.z;
}

vec3 convolveSH3(vec3 band0, vec3 band1, vec3 band2, vec3 weight)
{
	vec3 conv1 = lerp( vec3(1.0,1.0,1.0), vec3(0.6667,0.6667,0.6667), weight);
	vec3 conv2 = lerp( vec3(1.0,1.0,1.0), vec3(0.25,0.25,0.25), weight);
	return band0 + band1*conv1 + band2*conv2;
}

///

vec3 doubleConvolveSH(vec3 band0, vec3 band1, vec3 band2, float weight)
{
	vec3 conv = lerp( vec3(1.0,1.0,1.0), vec3(1.0,0.4444,0.0625), weight);
	return band0 + band1*conv.y + band2*conv.z;
}

vec3 doubleConvolveSH3(vec3 band0, vec3 band1, vec3 band2, vec3 weight)
{
	vec3 conv1 = lerp( vec3(1.0,1.0,1.0), vec3(0.4444,0.4444,0.4444), weight);
	vec3 conv2 = lerp( vec3(1.0,1.0,1.0), vec3(0.0625,0.0625,0.0625), weight);
	return band0 + band1*conv1 + band2*conv2;
}

#endif