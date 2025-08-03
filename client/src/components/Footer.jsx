const Footer = () => {
    return (
        <footer className="mt-12 border-t border-white/10">
            <div className="container mx-auto px-4 py-6 text-center text-brand-gray text-sm">
                <p>&copy; {new Date().getFullYear()} GreenPredict. Sebuah Capstone Project Lingkungan.</p>
            </div>
        </footer>
    );
}

export default Footer;
