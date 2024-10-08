import React from "react";
import LogoBar from "@/components/LogoBar";
import Footer from "@/components/Footer";

import "@/components/page.css"

export const dynamic = "force-static";

export const metadata = {
    title: "Terms of Use",
};

const TermsPage = () => {
    return (
        <div className="min-h-screen flex flex-col">
            <LogoBar />
            <main className="flex-grow bg-gray-100">
                <div className="prose max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 text-page">
                    <div className="mt-6 prose prose-indigo prose-lg text-gray-500">
                        <p>Last updated: 2024/08/06</p>

                        <h1 id="terms-of-use-for-videyo-com">
                            Terms of Use for videyo.com
                        </h1>
                        <h2 id="1-acceptance-of-terms">
                            1. Acceptance of Terms
                        </h2>
                        <p>
                            By accessing or using videyo.com (the
                            &quot;Service&quot;), you agree to be bound by these
                            Terms of Use. If you do not agree to these terms,
                            please do not use our Service.
                        </p>
                        <h2 id="2-description-of-service">
                            2. Description of Service
                        </h2>
                        <p>
                            videyo.com provides users with access to curated
                            lists of questions for various occasions. We reserve
                            the right to modify, suspend, or discontinue the
                            Service at any time, with or without notice.
                        </p>
                        <h2 id="3-user-conduct">3. User Conduct</h2>
                        <p>
                            You agree to use the Service only for lawful
                            purposes and in accordance with these Terms.
                            Prohibited conduct includes, but is not limited to:
                        </p>
                        <ul>
                            <li>
                                Posting or transmitting unlawful, threatening,
                                abusive, libelous, defamatory, obscene, vulgar,
                                pornographic, profane, or indecent information
                                of any kind.
                            </li>
                            <li>
                                Engaging in conduct that restricts or inhibits
                                any other user from using or enjoying the
                                Service.
                            </li>
                            <li>
                                Attempting to gain unauthorized access to the
                                Service, other user accounts, or computer
                                systems or networks connected to the Service.
                            </li>
                        </ul>
                        <h2 id="4-user-generated-content">
                            4. User-Generated Content
                        </h2>
                        <p>
                            By submitting content to the Service, you grant
                            videyo.com a worldwide, non-exclusive,
                            royalty-free license to use, reproduce, modify,
                            adapt, publish, translate, and distribute such
                            content. You represent and warrant that you own or
                            have the necessary rights to such content and that
                            it does not violate any third party&#39;s rights.
                        </p>
                        <h2 id="5-intellectual-property-rights">
                            5. Intellectual Property Rights
                        </h2>
                        <p>
                            All content on videyo.com, including but not
                            limited to text, graphics, logos, images, audio
                            clips, digital downloads, and software, is the
                            property of videyo.com or its content suppliers
                            and is protected by international copyright laws.
                        </p>
                        <h2 id="6-privacy-policy">6. Privacy Policy</h2>
                        <p>
                            Your use of the Service is also governed by our
                            Privacy Policy, which is incorporated into these
                            Terms by reference.
                        </p>
                        <h2 id="7-disclaimer-of-warranties">
                            7. Disclaimer of Warranties
                        </h2>
                        <p>
                            The Service is provided on an &quot;AS IS&quot; and
                            &quot;AS AVAILABLE&quot; basis. videyo.com
                            expressly disclaims all warranties of any kind,
                            whether express or implied, including but not
                            limited to the implied warranties of
                            merchantability, fitness for a particular purpose,
                            and non-infringement.
                        </p>
                        <h2 id="8-limitation-of-liability">
                            8. Limitation of Liability
                        </h2>
                        <p>
                            videyo.com shall not be liable for any indirect,
                            incidental, special, consequential, or punitive
                            damages, including without limitation, loss of
                            profits, data, use, goodwill, or other intangible
                            losses, resulting from your access to or use of or
                            inability to access or use the Service.
                        </p>
                        <h2 id="9-indemnification">9. Indemnification</h2>
                        <p>
                            You agree to indemnify, defend, and hold harmless
                            videyo.com, its officers, directors, employees,
                            agents, and third parties, for any losses, costs,
                            liabilities, and expenses relating to or arising out
                            of your use of the Service or your violation of
                            these Terms.
                        </p>
                        <h2 id="10-governing-law">10. Governing Law</h2>
                        <p>
                            These Terms shall be governed by and construed in
                            accordance with the laws of Ontario, Canada, without
                            regard to its conflict of law provisions.
                        </p>
                        <h2 id="11-changes-to-terms">11. Changes to Terms</h2>
                        <p>
                            We reserve the right, at our sole discretion, to
                            modify or replace these Terms at any time. We will
                            provide notice of any material changes by posting
                            the new Terms on this page and updating the
                            &quot;Last Updated&quot; date.
                        </p>
                        <h2 id="12-termination">12. Termination</h2>
                        <p>
                            We may terminate or suspend your access to the
                            Service immediately, without prior notice or
                            liability, for any reason whatsoever, including
                            without limitation if you breach the Terms.
                        </p>
                        <h2 id="13-contact-us">13. Contact Us</h2>
                        <p>
                            If you have any questions about these Terms, please
                            contact us at:
                        </p>
                        <p>Email: alex@videyo.com</p>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default TermsPage;
