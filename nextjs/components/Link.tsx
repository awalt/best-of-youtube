const CustomLink = ({ href, children, ...props }) => (
    <a href={href} {...props}>{children}</a>
  );
  
  export default CustomLink;