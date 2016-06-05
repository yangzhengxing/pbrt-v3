USE_TEXTURE2D(tInput);

uniform	vec4 uAmount; //chromatic shift amount in RGB, A = distortion.

BEGIN_PARAMS
	INPUT0(vec2,fCoord)

	OUTPUT_COLOR0(vec4)
END_PARAMS
{
	vec2 U = fCoord * 2.0 - vec2(1.0,1.0);
    
	//barrel/pincushion distortion
	float radiusSquared = dot(U,U);
	vec2 D = U * (1.0 - uAmount.w * radiusSquared);

	//faux zoom to hide edges
	D /= (1.0 - 2.0*min(uAmount.w,0.0));

	vec2 nCoord = 0.5*D + vec2(0.5,0.5);
	vec2 aberrationDir = fCoord - vec2(0.5,0.5);

	OUT_COLOR0 =   texture2D( tInput, nCoord + uAmount.x * aberrationDir );
	OUT_COLOR0.y = texture2D( tInput, nCoord + uAmount.y * aberrationDir ).y;
	OUT_COLOR0.z = texture2D( tInput, nCoord + uAmount.z * aberrationDir ).z;
}