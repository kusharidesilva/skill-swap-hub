export const UNIVERSITY_DOMAINS: Record<string, string[]> = {
  // Public universities recognized by the UGC.
  "University of Colombo": ["cmb.ac.lk"],
  "University of Peradeniya": ["pdn.ac.lk"],
  "University of Sri Jayewardenepura": ["sjp.ac.lk"],
  "University of Kelaniya": ["kln.ac.lk"],
  "University of Moratuwa": ["uom.lk", "mrt.ac.lk"],
  "University of Jaffna": ["jfn.ac.lk"],
  "University of Ruhuna": ["ruh.ac.lk"],
  "Eastern University, Sri Lanka": ["esn.ac.lk"],
  "South Eastern University of Sri Lanka": ["seu.ac.lk"],
  "Rajarata University of Sri Lanka": ["rjt.ac.lk"],
  "Sabaragamuwa University of Sri Lanka": ["sab.ac.lk"],
  "Wayamba University of Sri Lanka": ["wyb.ac.lk"],
  "The Open University of Sri Lanka": ["ou.ac.lk"],
  "University of the Visual and Performing Arts": ["vpa.ac.lk"],
  "Uva Wellassa University": ["uwu.ac.lk"],
  "University of Vavuniya": ["vau.ac.lk"],
  "Gampaha Wickramarachchi University of Indigenous Medicine": ["gwu.ac.lk"],
  "Institute of Technology, University of Moratuwa": ["itum.mrt.ac.lk"],

  // Other government higher-education institutes.
  "General Sir John Kotelawala Defence University": ["kdu.ac.lk"],
  "Buddhist and Pali University of Sri Lanka": ["bpu.ac.lk"],
  "Buddhasravaka Bhiksu University": ["busl.ac.lk"],
  "University of Vocational Technology": ["univotec.ac.lk"],
  "Ocean University of Sri Lanka": ["ocu.ac.lk"],
  "Sri Lanka Institute of Advanced Technological Education": ["sliate.ac.lk"],
  "Department of Technical Education and Training": ["dtet.gov.lk"],
  "Tertiary and Vocational Education Commission": ["tvec.gov.lk"],
  "Vocational Training Authority of Sri Lanka": ["vta.gov.lk", "course.vta.lk"],
  "National Apprentice and Industrial Training Authority": ["naita.gov.lk"],
  "Ceylon German Technical Training Institute": ["germantec.lk"],
  "National Institute of Fundamental Studies": ["nifs.ac.lk"],
  "National Institute of Education": ["nie.lk"],

  // Ministry-recognized degree-awarding institutes.
  "Institute of Surveying and Mapping": ["ism.ac.lk"],
  "Sri Lanka Institute of Information Technology (SLIIT)": ["sliit.lk"],
  "Sri Lanka Institute of Development Administration (SLIDA)": ["slida.lk"],
  "National Institute of Social Development (NISD)": ["nisd.ac.lk"],
  "Aquinas College of Higher Studies": ["aquinas.lk"],
  "South Asian Institute of Technology and Medicine (SAITM)": ["saitm.edu.lk"],
  "NSBM Green University": ["nsbm.ac.lk"],
  "CINEC Campus": ["cinec.edu"],
  "Sri Lanka International Buddhist Academy (SIBA)": ["siba.edu.lk"],
  "Institute of Chartered Accountants of Sri Lanka": ["casrilanka.com"],
  "SANASA Campus": ["sanasacampus.lk"],
  "Horizon Campus": ["horizoncampus.edu.lk"],
  "KIU Campus": ["kiu.ac.lk"],
  "Nagananda International Institute for Buddhist Studies (NIIBS)": ["niibs.lk", "niibs.edu.lk"],
  "Sri Lanka Technology Campus (SLTC)": ["sltc.ac.lk"],
  "Sri Lanka Institute of Nanotechnology (SLINTEC)": ["slintec.lk"],
  "Saegis Campus": ["saegis.ac.lk"],
  "ESOFT Metro Campus": ["esoft.lk"],
  "Institute of Chemistry Ceylon": ["ichemc.edu.lk"],
  "International College of Business and Technology (ICBT)": ["icbtcampus.edu.lk", "icbt.lk"],
  "Benedict XVI Catholic Institute of Higher Education (BCI)": ["bci.lk"],
  "Royal Institute Colombo (RIC)": ["ric.lk"],
  "Business Management School (BMS)": ["bms.lk"],
  "International Institute of Health Sciences (IIHS)": ["iihsciences.edu.lk"],
  "Lanka Nippon BizTech Institute (LNBTI)": ["lnbti.lk"],
  "Gateway Graduate School": ["gatewaycollege.lk"],
  "Lyceum Campus": ["lyceumcampus.lk"],
  "British School of Commerce": ["bsc.edu.lk"],
  "Sri Lanka Institute of Tourism and Hotel Management": ["slithm.edu.lk"],
  "Sri Lanka Institute of Textile and Apparel": ["slita.lk"],
  "American College of Higher Education": ["americancollege.lk"],
  "Asia Pacific Institute of Information Technology (APIIT)": ["apiit.lk"]
};

export const UNIVERSITIES = Object.keys(UNIVERSITY_DOMAINS);

// Registration uses the selected university, so the email must match that exact institution.
export function isEmailAllowedForUniversity(email: string, universityName: string): boolean {
  const allowedDomains = UNIVERSITY_DOMAINS[universityName];
  if (!allowedDomains) return false;

  const parts = email.trim().toLowerCase().split("@");
  if (parts.length !== 2) return false;
  const emailDomain = parts[1];

  // Subdomains are accepted because some faculties issue their own email domain.
  return allowedDomains.some(
    (domain) => emailDomain === domain || emailDomain.endsWith("." + domain)
  );
}

export function isUniversityEmail(email: string): boolean {
  const parts = email.trim().toLowerCase().split("@");
  if (parts.length !== 2) return false;
  const emailDomain = parts[1];

  // Login only needs to know whether the address belongs to any supported institute.
  return Object.values(UNIVERSITY_DOMAINS).some((domains) =>
    domains.some((domain) => emailDomain === domain || emailDomain.endsWith("." + domain))
  );
}
