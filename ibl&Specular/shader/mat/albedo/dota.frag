#include "data/shader/mat/state.frag"

#define	AlbedoDota_Present

USE_TEXTURE2D(tDotaColorMap);
USE_TEXTURE2D(tDotaMask1);
USE_TEXTURE2D(tDotaDetailMap);
USE_TEXTURE2D(tDotaFresnelWarp);
USE_TEXTURE3D(tDotaEdgeColorWarp);

uniform float	uDotaColorIgnoreAlpha;
uniform float	uDotaDetail;
uniform float	uDotaDetailTile;
uniform float	uDotaSelfIllumination;
uniform vec4	uDotaMask1Enable;

void	AlbedoDota( inout FragmentState s )
{
	//dota mask 1
	vec4 mask1 = texture2D( tDotaMask1, s.vertexTexCoord );
	mask1 *= uDotaMask1Enable;

	//fresnel gradients
	float NdotV = saturate( dot( s.normal, s.vertexEye ) );
	vec3 fresnel = texture2D( tDotaFresnelWarp, vec2(NdotV,0.0) ).xyz;
	
	//albedo
	vec4 colorSample = texture2D( tDotaColorMap, s.vertexTexCoord );
	s.albedo.xyz = colorSample.xyz;
	s.albedo.w = mix( colorSample.w, s.albedo.w, uDotaColorIgnoreAlpha );
	
	//edge color warp
	vec3 warpedAlbedo = texture3D( tDotaEdgeColorWarp, s.albedo.xyz ).xyz;
	s.albedo.xyz = mix( s.albedo.xyz, warpedAlbedo, fresnel.g * mask1.g );

	//detail map (additive only for now, could do other blend modes)
	s.albedo.xyz +=	(uDotaDetail * mask1.r) * texture2D( tDotaDetailMap, s.vertexTexCoord * uDotaDetailTile ).xyz;

	//self illumination
	s.emissiveLight += (uDotaSelfIllumination * mask1.a) * s.albedo.xyz;
	
	//metalness reduces albedo
	s.albedo.xyz = s.albedo.xyz - s.albedo.xyz * mask1.b;

	//other shading stages will need these values
	s.generic = vec4(	mask1.g,		//diffuse gradient selector
						mask1.b,		//metalness
						fresnel.r,		//rim light fresnel
						fresnel.b	);	//specular fresnel
}

#define	Albedo	AlbedoDota