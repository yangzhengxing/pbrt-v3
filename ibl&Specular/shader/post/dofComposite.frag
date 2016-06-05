USE_TEXTURE2D(tFar);
USE_TEXTURE2D(tNear);
USE_TEXTURE2D(tDepth);

uniform vec3	uFocus;	// { focusDist, frontScale, backScale }
uniform vec2	uFarBlend;
uniform vec2	uTexelSize; // { 1/w, 1/h }

BEGIN_PARAMS
	INPUT0(vec2,fCoord)

	OUTPUT_COLOR0(vec4)
END_PARAMS
{
	//look up depth and determine CoC
	float camDist = -texture2D( tDepth, fCoord ).x;
	float coc = (uFocus.x - camDist) / camDist;
	coc *= (camDist < uFocus.x) ? uFocus.y : uFocus.z;
	coc = clamp( coc, -1.0, 1.0 );

	//sample far field
	vec4 far = texture2D( tFar, fCoord );
	far.xyz /= (far.w > 0.0) ? far.w : 1.0;
	far.w = saturate( coc*uFarBlend.x + uFarBlend.y );
	far.w *= far.w;
	
	//sample near field
	vec4 near = texture2D( tNear, fCoord );
	near.xyz /= (near.w > 0.0) ? near.w : 1.0;
	near.w = saturate( 4.0 * near.w );

	//final output
	OUT_COLOR0.xyz = far.xyz*far.w*(1.0-near.w) + near.xyz*near.w;
	OUT_COLOR0.w = (1.0-far.w)*(1.0-near.w);
}