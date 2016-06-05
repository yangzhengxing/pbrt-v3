USE_TEXTURE2D(tImage);

uniform vec2    LensCenter;
uniform vec2    ScreenCenter;
uniform vec2    Scale;
uniform vec2    ScaleIn;
uniform vec4    HmdWarpParam;
uniform vec4    ChromAbParam;

BEGIN_PARAMS
	INPUT0(vec2,fCoord)

	OUTPUT_COLOR0(vec3)
END_PARAMS
{
	vec2 theta = (fCoord - LensCenter) * ScaleIn;
	float rSq = dot( theta.xy, theta.xy );
	vec2 theta1 =   theta *
				   (HmdWarpParam.x +
					HmdWarpParam.y * rSq +
					HmdWarpParam.z * rSq*rSq +
					HmdWarpParam.w * rSq*rSq*rSq);

	vec2 tcGreen = LensCenter + Scale * theta1;

	vec2 clp = tcGreen - vec2(0.5,0.5);
	if( abs(clp.x) > 0.5 || abs(clp.y) > 0.5 )
	{ discard; }
	
	vec3 r = texture2D( tImage, tcGreen ).xyz;

	vec2 thetaBlue = theta1 * (ChromAbParam.z + ChromAbParam.w * rSq);
	vec2 tcBlue = LensCenter + Scale * thetaBlue;
	r.b = texture2D( tImage, tcBlue ).b;

	vec2 thetaRed = theta1 * (ChromAbParam.x + ChromAbParam.y * rSq);
	vec2 tcRed = LensCenter + Scale * thetaRed;
	r.r = texture2D( tImage, tcRed ).r;

	OUT_COLOR0.xyz = r;
}