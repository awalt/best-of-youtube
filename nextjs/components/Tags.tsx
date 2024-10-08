const Tags = ({ video }) => {
    return (
        <>
            {video.format &&
                video.format.map((item) => (
                    <span
                        key={item}
                        className="bg-green-100 text-green-800 rounded-full px-2 py-1 text-xs mr-2 mb-2 inline-block"
                    >
                        {item}
                    </span>
                ))}
            {video.tags &&
                video.tags.map((tag) => (
                    <span
                        key={tag}
                        className="bg-blue-100 text-blue-800 rounded-full px-2 py-1 text-xs mr-2 mb-2 inline-block"
                    >
                        {tag}
                    </span>
                ))}
        </>
    );
};


export default Tags;
