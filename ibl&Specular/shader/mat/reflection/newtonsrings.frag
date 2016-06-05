#include "data/shader/mat/state.frag"

USE_TEXTURE2D(tNewtonsRingsInterference);

uniform float	uNewtonsRingsIntensity;
uniform float	uNewtonsRingsThickness;

void	NewtonsRings( inout FragmentState s )
{
	//find a multiple of the wavelenth at peak constructive interference;
	//use it to look into our spectrum. Given by:
	//	k * l = thickness / cos(theta)
	//where k is an integer, l is a given light wavelength,
	//and theta is the angle of incidence. -jdr
	float cosTheta = dot( s.vertexEye, s.normal );
	float wavelengthMult = uNewtonsRingsThickness / cosTheta;
	vec3 interference = texture2D( tNewtonsRingsInterference, vec2(wavelengthMult,0.0) ).xyz;

	//a fresnel-like effect accompanies this
	float fade = 1.0 - cosTheta;
	fade *= fade; fade *= fade;
	fade = 1.0 - fade*fade;

	//blend based on artist specified intensity
	interference = mix( vec3(1.0,1.0,1.0), interference, uNewtonsRingsIntensity * fade );

	//interference modulates existing specular reflection
	s.specularLight *= interference;
}

#define	ReflectionSecondary	NewtonsRings