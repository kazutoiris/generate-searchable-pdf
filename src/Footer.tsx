import './App.css'

function Footer() {
    return (
        <>
            <footer>
                <hr className="my-6 border-gray-200 sm:mx-auto dark:border-gray-700 lg:my-8" />
                <div className="block text-sm text-gray-500 sm:text-center dark:text-gray-400">
                    <span id="busuanzi_container_site_pv">本工具总使用 <span id="busuanzi_value_site_pv"></span> 次</span>
                </div>
            </footer>
        </>
    )
}

export default Footer
