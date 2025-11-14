import { getHeroSlides, getContactInfo, getServiceTimes } from '$lib/server/database';

export const load = async () => {
	const heroSlides = getHeroSlides();
	const contactInfo = getContactInfo();
	const serviceTimes = getServiceTimes();
	return {
		heroSlides: heroSlides.length > 0 ? heroSlides : null,
		contactInfo,
		serviceTimes
	};
};
