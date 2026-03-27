export function Docs() {
  const sections = [
    {
      title: "What is Post-Quantum Cryptography?",
      content: "Post-quantum cryptography (PQC) refers to cryptographic algorithms that are designed to be secure against attacks by both classical and quantum computers. As quantum computing advances, many widely-used encryption methods like RSA and ECC will become vulnerable to Shor's algorithm, which can efficiently solve the mathematical problems these systems rely on."
    },
    {
      title: "Why Should I Care Now?",
      content: "Even though large-scale quantum computers don't exist yet, the threat is real today. Adversaries can harvest encrypted data now and decrypt it later when quantum computers become available — this is known as the 'harvest now, decrypt later' attack. NIST finalized its first post-quantum cryptography standards in August 2024, and the US government has mandated federal agencies be quantum-resistant by 2035."
    },
    {
      title: "NIST Post-Quantum Standards",
      items: [
        { name: "ML-KEM (FIPS 203)", desc: "Key Encapsulation Mechanism based on CRYSTALS-Kyber. Replaces RSA/ECDH for key exchange." },
        { name: "ML-DSA (FIPS 204)", desc: "Digital Signature Algorithm based on CRYSTALS-Dilithium. Replaces RSA/ECDSA for signatures." },
        { name: "SLH-DSA (FIPS 205)", desc: "Stateless Hash-Based Digital Signature Algorithm based on SPHINCS+. A conservative alternative for signatures." },
      ]
    },
    {
      title: "Quantum Threat Classification",
      items: [
        { name: "CRITICAL — Broken by Shor's Algorithm", desc: "RSA, ECDSA, ECDH, DSA, DH, EdDSA, Ed25519, X25519. These rely on integer factorization or discrete logarithm problems that quantum computers solve efficiently." },
        { name: "WARNING — Weakened by Grover's Algorithm", desc: "AES-128, DES, 3DES, MD5, SHA-1. Grover's algorithm effectively halves the security level of symmetric ciphers and hash functions." },
        { name: "OK — Quantum Resistant", desc: "AES-256, SHA-256, SHA-3, ML-KEM, ML-DSA, SLH-DSA. These maintain sufficient security margins even against quantum attacks." },
      ]
    },
    {
      title: "Migration Strategy",
      content: "Start by inventorying your cryptographic usage (that's what qcrypt-scan does). Then prioritize replacing CRITICAL findings first — especially in systems handling long-lived secrets. Consider hybrid approaches (e.g., ML-KEM + X25519) during the transition period to maintain classical security guarantees while adding quantum resistance."
    }
  ];

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-[#e0e0e0]">
          Quantum Cryptography Guide
        </h1>
        <p className="text-slate-500 dark:text-[#666666] mt-1">
          Everything you need to know about the quantum threat and how to protect your systems.
        </p>
      </div>

      {sections.map((section) => (
        <div key={section.title} className="bg-white dark:bg-[#111111] rounded-xl border border-slate-200 dark:border-[#1a1a1a] p-6">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-[#e0e0e0] mb-3">
            {section.title}
          </h2>
          {section.content && (
            <p className="text-sm text-slate-600 dark:text-[#999999] leading-relaxed">
              {section.content}
            </p>
          )}
          {section.items && (
            <div className="space-y-4 mt-2">
              {section.items.map((item) => (
                <div key={item.name}>
                  <h3 className="text-sm font-semibold text-blue-600 dark:text-[#00FF41]">{item.name}</h3>
                  <p className="text-sm text-slate-600 dark:text-[#999999] mt-0.5">{item.desc}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* External Links */}
      <div className="bg-white dark:bg-[#111111] rounded-xl border border-slate-200 dark:border-[#1a1a1a] p-6">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-[#e0e0e0] mb-3">
          Quick References
        </h2>
        <ul className="space-y-2">
          {[
            { label: 'NIST PQC Standardization', url: 'https://csrc.nist.gov/projects/post-quantum-cryptography' },
            { label: 'Quantum Threat Timeline', url: 'https://globalriskinstitute.org/publication/quantum-threat-timeline-report-2024/' },
            { label: 'Crypto Agility Best Practices', url: 'https://www.nccoe.nist.gov/crypto-agility-considerations-migrating-post-quantum-cryptographic-algorithms' },
          ].map((link) => (
            <li key={link.label}>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-500 dark:text-[#00FF41] hover:underline flex items-center gap-2"
              >
                {link.label}
                <span className="text-xs">↗</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
