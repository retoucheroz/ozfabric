import re

with open('components/pages/LandingPage.tsx', 'r') as f:
    content = f.read()

# 1. Add ScrollDownIcon component
scroll_component = """
const ScrollDownIcon = ({ targetId }: { targetId?: string }) => {
    const handleClick = () => {
        if (targetId) {
            const el = document.getElementById(targetId);
            if (el) el.scrollIntoView({ behavior: 'smooth' });
        } else {
            window.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
        }
    };
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center cursor-pointer p-4 group"
            onClick={handleClick}
        >
            <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            >
                <ChevronDown className="w-8 h-8 text-white/40 group-hover:text-[#F5F5F5] transition-colors" />
            </motion.div>
        </motion.div>
    );
};

export default function LandingPage() {"""

content = content.replace("export default function LandingPage() {", scroll_component)

# 2. General Purples to F5F5F5
content = content.replace("selection:bg-purple-600/30", "selection:bg-[#F5F5F5]/30 selection:text-black")
content = content.replace("bg-violet-600 origin-left", "bg-[#F5F5F5] origin-left")
content = content.replace("<span className=\"text-[#6D28D9]\">.ai</span>", "<span className=\"text-[#F5F5F5]\">.ai</span>")
content = content.replace("text-[#6D28D9]", "text-[#F5F5F5]")

# 3. Logo toggle
old_logo = """<div className="w-10 h-5 bg-[#5B21B6] rounded-full flex items-center justify-between px-1 shadow-inner border border-[#5B21B6]/50">
                            <div className="w-[1.5px] h-2.5 bg-white/70 rounded-full ml-1" />
                            <div className="w-3.5 h-3.5 bg-white rounded-full shadow-sm" />
                        </div>"""
new_logo = """<div className="w-10 h-5 bg-[#F5F5F5] rounded-full flex items-center justify-between px-1 shadow-inner border border-white/20">
                            <div className="w-[1.5px] h-2.5 bg-[#0D0D0F]/70 rounded-full ml-1" />
                            <div className="w-3.5 h-3.5 bg-[#0D0D0F] rounded-full shadow-sm" />
                        </div>"""
content = content.replace(old_logo, new_logo)

# 4. Hero opacity & ID
content = content.replace('<section className="relative min-h-[100vh] flex flex-col items-center justify-center pt-24 pb-12 px-6 overflow-hidden">', 
                          '<section id="hero" className="relative min-h-[100vh] flex flex-col items-center justify-center pt-24 pb-12 px-6 overflow-hidden">')
content = content.replace('className="object-cover object-top opacity-50"', 'className="object-cover object-top opacity-30"')

# Hero button
content = content.replace('bg-[#5B21B6] hover:bg-[#4C1D95] text-white', 'bg-[#F5F5F5] hover:bg-white text-black')

# Replace old indicator in Hero with <ScrollDownIcon targetId="pipeline" />
old_indicator = """                {/* Animated Scroll Indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1, duration: 1 }}
                    className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none"
                >
                    <motion.div
                        animate={{ y: [0, 10, 0] }}
                        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    >
                        <ChevronDown className="w-5 h-5 text-white/40" />
                    </motion.div>
                </motion.div>"""
content = content.replace(old_indicator, '                <ScrollDownIcon targetId="pipeline" />')

# Pipeline section
content = content.replace('< section className="py-32 px-6 bg-transparent relative" >', '<section id="pipeline" className="py-32 px-6 bg-transparent relative">')
content = content.replace('via-violet-500/30', 'via-[#F5F5F5]/30')
content = content.replace('text-violet-400', 'text-[#F5F5F5]')
content = content.replace('</section >\n\n            {/* BEFORE / AFTER', '<ScrollDownIcon targetId="showcase" />\n            </section>\n\n            {/* BEFORE / AFTER')

# Showcase
content = content.replace('< section className="py-32 px-6 relative overflow-hidden" >', '<section id="showcase" className="py-32 px-6 relative overflow-hidden">')
content = content.replace('bg-violet-900/10', 'bg-[#F5F5F5]/5')
content = content.replace('text-violet-500', 'text-[#F5F5F5]')
content = content.replace('bg-violet-500/20', 'bg-[#F5F5F5]/20')
content = content.replace('bg-violet-500 shadow-[0_0_15px_rgba(139,92,246,1)]', 'bg-[#F5F5F5]')
content = content.replace('bg-violet-500', 'bg-[#F5F5F5]')
content = content.replace('bg-violet-600/90', 'bg-[#F5F5F5]/90 text-black')
content = content.replace('from-violet-900/40', 'from-[#F5F5F5]/10')
content = content.replace('</section >\n\n            {/* FEATURES', '<ScrollDownIcon targetId="features" />\n            </section>\n\n            {/* FEATURES')

# Features
content = content.replace('< section className="py-32 px-6 bg-[#0D0D0F]" >', '<section id="features" className="py-32 px-6 bg-[#0D0D0F] relative">')
content = content.replace('</section >\n\n            {/* CALL TO ACTION', '<ScrollDownIcon targetId="cta" />\n            </section>\n\n            {/* CALL TO ACTION')

# CTA
content = content.replace('< section className="py-32 px-6 relative overflow-hidden flex justify-center text-center" >', '<section id="cta" className="py-32 px-6 relative overflow-hidden flex justify-center text-center">')
content = content.replace('from-violet-900/20', 'from-[#F5F5F5]/5')

# Ensure </section > fixes
content = content.replace('</section >', '</section>')

with open('components/pages/LandingPage.tsx', 'w') as f:
    f.write(content)
