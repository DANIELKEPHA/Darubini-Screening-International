"use client";

import Link from "next/link";
import React, {JSX, useState} from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFacebook,
  faInstagram,
  faLinkedin,
  faXTwitter,
} from "@fortawesome/free-brands-svg-icons";
import { MapPin, Phone, Mail, Shield, FileCheck, Users, Home, Gavel, Briefcase, AlertTriangle, FileText, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { motion } from "framer-motion";

const FooterSection = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const services = [
    {
      title: "Investigation Services",
      icon: <Shield className="h-4 w-4 mt-1 mr-2 flex-shrink-0" />,
      href: "/investigation-services",
      fullDescription:
          "Qualified investigation services are crucial for organizations suspected of fraud, corruption, or employee misconduct, enabling them to establish facts and take control of challenging situations. At Darubini we have the skills and experience to help you respond quickly and effectively to these challenges. We are qualified to provide fraud and corruption investigation, conduct and performance investigation, grievance investigation, forensic accounting and financial investigation. Our investigation services assist clients in establishing facts, interviewing witnesses, suspects, and collecting information from records, aiding in recovering stolen assets, making insurance claims, taking disciplinary action, or initiating legal proceedings.",
    },
    {
      title: "Document Verification",
      icon: <FileCheck className="h-4 w-4 mt-1 mr-2 flex-shrink-0" />,
      href: "/document-verification",
      fullDescription:
          "Document Verification allows organisations to take information taken from a person's identity document, with their consent, and compare this against the corresponding record of the document issuing agency. It provides a key tool for organisations that are seeking to prevent the enrolment or registration of customers, clients and even staff who may be using fraudulent identities. Identity documents that we verify include: Birth and Marriage Certificates, National IDs, Driver Licences, Education Certificates, Passports, Visas.",
    },
    {
      title: "Vetting and Screening",
      icon: <Users className="h-4 w-4 mt-1 mr-2 flex-shrink-0" />,
      href: "/vetting-and-screening",
      fullDescription:
          "Employment screening services and background checks are crucial for maintaining workforce integrity and safety. With rising lawsuits, training costs, workplace violence, and theft, pre-employment screening is now a necessity for businesses. Candidates often lie about their employment history or qualifications, leading to wrongful employment. Businesses' background checks vary based on size, industry, and other factors. Darubini offers tools to screen candidates, verify curriculum vitae content, and verify credit, qualifications, driver's licenses, and criminal records. Their complete line of employee screening and vetting services helps businesses protect employees, comply with regulatory and industry requirements, and maintain smooth business operations.",
    },
    {
      title: "Domestic Staff",
      icon: <Home className="h-4 w-4 mt-1 mr-2 flex-shrink-0" />,
      href: "/domestic-staff",
      fullDescription:
          "Our Domestic Workers tests provide you with necessary information you require to ensure that your domestic help has a clean bill of health before they become part of the household. Domestic workers are individuals hired to work within private homes to clean, cook, provide care to children, the elderly, or disabled individuals. They include stewards, cooks, house helps and nannies as well as others whose jobs involve close contact with the family. It is very important to do a background check on your domestic worker to make sure that they are people you can trust to look after your house, family or loved ones. You need to find out as much as you possibly can about this person to ensure safety, dependability and professionalism.",
    },
    {
      title: "Criminal Checks",
      icon: <Gavel className="h-4 w-4 mt-1 mr-2 flex-shrink-0" />,
      href: "/criminal-checks",
      fullDescription:
          "A criminal record check is a crucial part of a comprehensive employee screening program for organizations. Darubini offers a high-quality service to help organizations make smarter hiring decisions. Employers conduct background screening for various reasons, including the risk of negligent hiring lawsuits, increased security and identity-verification strategies due to terrorist acts, scrutiny of corporate executives and directors due to scandals, and the fear of fraudulent credentials from job applicants. These factors make employers cautious in accepting job applicants' word at face value.",
    },
    {
      title: "For Corporate",
      icon: <Briefcase className="h-4 w-4 mt-1 mr-2 flex-shrink-0" />,
      href: "/corporate-screening",
      fullDescription:
          "Pre-employment screening programs can reduce the risk of employee theft, misappropriation, criminal activity, or violence in the workplace, and can also prevent negligent hiring lawsuits. It also helps avoid costly terminations. Reference interviews provide detailed reports of candidates' workplace performance, as described by their former supervisor or manager. Darubini offers a range of pre-employment and continuing-employment screening products and services to help employers make informed decisions and ensure compliance with guidelines. Their staff is experienced in handling sensitive information.",
    },
    {
      title: "Fraud Awareness",
      icon: <AlertTriangle className="h-4 w-4 mt-1 mr-2 flex-shrink-0" />,
      href: "/fraud-awareness",
      fullDescription:
          "Fraud is a global issue affecting economies, businesses, and individuals, including bribery, corruption, identity fraud, counterfeit goods, and Ponzi schemes. It poses a significant threat to organizations and is on the rise. Fraud awareness training is crucial in preventing and controlling fraud by raising awareness among employees. Many fraud and corruption cases are not identified early due to staff's inability to recognize warning signs, reporting suspicions, or confidence in the reporting system or investigation process. Our tailored training course explains different types of fraud, prevention principles, fraud legislation, and real-life cases, while also exploring workplace fraud prevention and tackling.",
    },
    {
      title: "Tenant Screening",
      icon: <FileText className="h-4 w-4 mt-1 mr-2 flex-shrink-0" />,
      href: "/tenant-screening",
      fullDescription:
          "Tenant Screening is an essential process when you’re letting out your Investment property. Knowing exactly who is moving into your property will help you to make an informed decision about the tenants you choose and who better to trust in the Kenya’s market. These checks provide you with all the facts you need to know about a tenant’s background history and credit reports, before you make that vital decision to let. Letting a property to the wrong person, based on inaccurate or wilfully misleading information, could result in potentially high damages to your income, your integrity and your reputation. We provide two levels of service, Basic Profile and Full Profile. Both levels of service include full credit history checks and if you use our Full Profile service employment and income checks, previous letting references and enhanced background checks are included. Our tenant Screening service is accurate and easy to use and will provide you with all the information you need to make informed property letting decisions.",
    },
  ];

  type Service = {
    title: string;
    icon: JSX.Element;
    href: string;
    fullDescription: string;
    description?: string;
    details?: string[];
  };


  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const handleServiceClick = (service: Service) => {
    setSelectedService(service);
    setIsModalOpen(true);
  };


  return (
      <footer className="bg-gradient-to-br from-primary-800 to-primary-700 text-white pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            {/* Company Info */}
            <div className="space-y-6">
              <Link href="/" className="flex items-center group">
                <div className="flex items-center gap-3">
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-100 to-secondary-400 font-sligoil">
                  Darubini Screening
                </span>
                </div>
              </Link>
              <p className="text-gray-400 leading-relaxed">
                Trusted global background screening and compliance solutions for businesses worldwide.
              </p>
              <div className="flex space-x-4">
                <a href="#" aria-label="LinkedIn" className="text-gray-400 hover:text-white transition-colors">
                  <FontAwesomeIcon icon={faLinkedin} className="h-5 w-5" />
                </a>
                <a href="#" aria-label="Twitter" className="text-gray-400 hover:text-white transition-colors">
                  <FontAwesomeIcon icon={faXTwitter} className="h-5 w-5" />
                </a>
                <a href="#" aria-label="Facebook" className="text-gray-400 hover:text-white transition-colors">
                  <FontAwesomeIcon icon={faFacebook} className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Services */}
            <div>
              <h3 className="text-lg font-semibold mb-6 uppercase tracking-wider">Services</h3>
              <ul className="space-y-3">
                {services.map((service, index) => (
                    <li key={index}>
                      <button
                          onClick={() => handleServiceClick(service)}
                          className="text-gray-400 hover:text-white transition-colors flex items-start w-full text-left"
                      >
                        {service.icon}
                        <span>{service.title}</span>
                      </button>
                    </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="text-lg font-semibold mb-6 uppercase tracking-wider">Resources</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/blogs" className="text-gray-400 hover:text-white transition-colors">
                    Blog & Insights
                  </Link>
                </li>
                <li>
                  <Link href="/compliance-guides" className="text-gray-400 hover:text-white transition-colors">
                    Compliance Guides
                  </Link>
                </li>
                <li>
                  <Link href="/case-studies" className="text-gray-400 hover:text-white transition-colors">
                    Case Studies
                  </Link>
                </li>
                <li>
                  <Link href="/our-solutions" className="text-gray-400 hover:text-white transition-colors">
                    Our Solutions
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="text-gray-400 hover:text-white transition-colors">
                    About Us
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-lg font-semibold mb-6 uppercase tracking-wider">Contact Us</h3>
              <address className="not-italic space-y-4 text-gray-400">
                <div className="flex items-start">
                  <MapPin className="h-4 w-4 mt-1 mr-3 flex-shrink-0" />
                  <span>
                  TRV Plaza, 58 Muthithi Road, Westlands.<br />
                  P.O Box 6079 - 00100, GPO Nairobi, Kenya
                </span>
                </div>

                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-3 flex-shrink-0" />
                  <div className="space-y-1">
                    <a href="tel:+254738743008" className="block hover:text-white transition-colors">Support: +254 738 743 008</a>
                  </div>
                </div>

                <div className="flex items-start">
                  <Mail className="h-4 w-4 mt-1 mr-3 flex-shrink-0" />
                  <div className="space-y-1">
                    <a href="mailto:info@darubiniscreening.com" className="block hover:text-white transition-colors">info@darubiniscreening.com</a>
                    <a href="mailto:relations@darubiniscreening.com" className="block hover:text-white transition-colors">relations@darubiniscreening.com</a>
                  </div>
                </div>
              </address>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-800">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-sm text-gray-500 mb-4 md:mb-0">
                © {new Date().getFullYear()} Darubini Screening International. All rights reserved.
              </p>
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-gray-500">
                <Link href="/privacyPolicy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
                <Link href="/cookiePolicy" className="hover:text-white transition-colors">
                  Cookie Policy
                </Link>
                <Link href="/gdpr" className="hover:text-white transition-colors">
                  GDPR
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Modal for Service Details */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300, damping: 20, duration: 0.3 }}
                className="bg-white border border-gray-200 text-gray-900 rounded-lg max-w-2xl"
            >
              <DialogHeader className="flex justify-between items-center px-6 pt-6">
                <DialogTitle className="text-2xl font-bold">{selectedService?.title}</DialogTitle>
              </DialogHeader>
              <DialogDescription className="text-base px-6 pb-6">
                {selectedService?.fullDescription}
              </DialogDescription>
            </motion.div>
          </DialogContent>

        </Dialog>
      </footer>
  );
};

export default FooterSection;