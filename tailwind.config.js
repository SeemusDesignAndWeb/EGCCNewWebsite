/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			fontFamily: {
				sans: ['Montserrat', 'sans-serif']
			},
			colors: {
				primary: '#4BB170', // Green (main brand color)
				'primary-dark': '#3a8a56',
				'brand-blue': '#4A97D2',
				'brand-green': '#4BB170',
				'brand-yellow': '#E6A324',
				'brand-red': '#A62524',
				'dark-gray': '#252525',
				'medium-gray': '#353535',
				'light-gray': '#757575'
			}
		}
	},
	plugins: []
};

