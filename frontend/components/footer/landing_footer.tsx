const columns = [
  {
    title: 'Product',
    links: ['Features', 'Pricing', 'Integrations', 'Changelog'],
  },
  {
    title: 'Company',
    links: ['About', 'Careers', 'Blog', 'Contact'],
  },
  {
    title: 'Legal',
    links: ['Privacy', 'Terms', 'Security'],
  },
]

export function LandingFooter() {
  return (
    <footer className="hidden border-t border-[#27272A] bg-[#09090B] md:block">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div>
          <p className="text-lg font-semibold text-[#F4F4F5]">My Pay</p>
          <p className="mt-3 max-w-xs text-sm leading-6 text-[#A1A1AA]">
            Track every minute and every dollar so payroll stays accurate, on time,
            and easy to understand.
          </p>
        </div>

        {columns.map((column) => (
          <div key={column.title}>
            <p className="text-sm font-semibold text-[#F4F4F5]">{column.title}</p>
            <ul className="mt-4 space-y-3">
              {column.links.map((link) => (
                <li key={link}>
                  <a href="#" className="text-sm text-[#A1A1AA] hover:text-[#F4F4F5]">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-[#27272A]">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-sm text-[#A1A1AA] sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} My Pay. All rights reserved.</p>
          <div className="flex gap-5">
            <a href="#" className="hover:text-[#F4F4F5]">
              Status
            </a>
            <a href="#" className="hover:text-[#F4F4F5]">
              Support
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
